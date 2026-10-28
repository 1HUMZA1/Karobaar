import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { dbFirestore } from './firebase';
import { localDb } from './localDb';
import { v4 as uuidv4 } from 'uuid';

/**
 * Offline-First Database Service wrapping Firestore with strict multi-tenant isolation
 * and multi-device cloud synchronization (Laptop <-> Mobile).
 */
class DatabaseService {

  constructor() {
    this.syncInProgress = false;
    this._startSyncLoop();
  }

  // --- Core Sync Logic ---
  
  async _startSyncLoop() {
    setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        this.syncPendingQueue();
        const activeBizId = localStorage.getItem('karobaar-active-business') || 'demo-business-1';
        this.syncAllFromCloud(activeBizId);
      }
    }, 12000); // Check every 12 seconds
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.syncPendingQueue();
        const activeBizId = localStorage.getItem('karobaar-active-business') || 'demo-business-1';
        this.syncAllFromCloud(activeBizId);
      });
    }
  }

  // Two-way synchronization: Pull latest records from Firestore so Laptop & Mobile stay in sync
  async syncAllFromCloud(businessId = 'demo-business-1') {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    if (this.syncInProgress) return;

    const collectionsToSync = ['products', 'sales', 'customers', 'expenses', 'suppliers', 'invoices', 'employees', 'purchases', 'stock_movements', 'audit_logs'];
    
    for (const col of collectionsToSync) {
      try {
        const q = collection(dbFirestore, `businesses/${businessId}/${col}`);
        const snapshot = await this._withTimeout(getDocs(q), 5000);
        if (snapshot && !snapshot.empty) {
          const records = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          localDb.bulkSave(col, records, businessId);
        }
      } catch (err) {
        // Fallback silently if offline or blocked
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('karobaar_data_synced', { detail: { businessId } }));
      window.dispatchEvent(new CustomEvent('karobaar_sync_update'));
    }
  }

  async syncPendingQueue() {
    if (this.syncInProgress) return;
    this.syncInProgress = true;

    const queue = localDb.getPendingQueue();
    if (queue.length === 0) {
      this.syncInProgress = false;
      return;
    }

    console.log(`[SYNC] Attempting to sync ${queue.length} pending items...`);

    for (const item of queue) {
      try {
        let docRef;
        if (!item.businessId || item.collectionName === 'users' || item.collectionName === 'businesses') {
          docRef = doc(dbFirestore, item.collectionName, item.id);
        } else {
          docRef = doc(dbFirestore, `businesses/${item.businessId}/${item.collectionName}`, item.id);
        }

        const cleanData = { ...item.data };
        delete cleanData._businessId;
        delete cleanData._syncStatus;
        delete cleanData._localUpdatedAt;
        delete cleanData.id;

        if (item.operation === 'SET') {
          await this._withTimeout(setDoc(docRef, cleanData, { merge: true }), 8000);
        } else if (item.operation === 'DELETE') {
          await this._withTimeout(deleteDoc(docRef), 8000);
        }

        localDb.markQueueItemSuccess(item.queueId);
        console.log(`[SYNC] Successfully synced ${item.collectionName}/${item.id}`);
      } catch (e) {
        console.warn(`[SYNC] Failed to sync ${item.collectionName}/${item.id}`, e.message);
        localDb.markQueueItemFailed(item.queueId, e.message);
      }
    }

    this.syncInProgress = false;
  }

  // Helper to prevent hanging promises
  async _withTimeout(promise, ms = 3500) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return Promise.reject(new Error('offline-fast-fail'));
    }
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('connection-timeout'));
      }, ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
  }

  // --- Data Access Methods ---
  
  async getRawCollection(collectionName) {
    const cached = localDb.getAll(collectionName);
    
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(async () => {
        try {
          const q = collection(dbFirestore, collectionName);
          const snapshot = await getDocs(q);
          const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          localDb.bulkSave(collectionName, records);
        } catch (e) {}
      }, 0);
    }
    
    return cached || [];
  }

  async getCollection(collectionName, businessId = null) {
    if (!businessId || collectionName === 'users' || collectionName === 'businesses') {
      return this.getRawCollection(collectionName);
    }
    
    const cached = localDb.getAll(collectionName, businessId);
    
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(async () => {
        try {
          const q = collection(dbFirestore, `businesses/${businessId}/${collectionName}`);
          const snapshot = await getDocs(q);
          if (snapshot && !snapshot.empty) {
            const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            localDb.bulkSave(collectionName, records, businessId);
          }
        } catch (e) {}
      }, 0);
    }
    
    return cached || [];
  }

  // Save an entire collection locally (used by demo/initial data seeding)
  async saveCollection(collectionName, records, businessId = null) {
    localDb.bulkSave(collectionName, records, businessId);
    
    // Also push to Firestore in background so other devices (laptop/mobile) receive it
    if (businessId && typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(async () => {
        for (const r of records) {
          try {
            const docRef = doc(dbFirestore, `businesses/${businessId}/${collectionName}`, r.id);
            const clean = { ...r };
            delete clean.id;
            setDoc(docRef, clean, { merge: true }).catch(() => {});
          } catch (_) {}
        }
      }, 100);
    }
    return records;
  }

  // Save a single record directly to local database & cloud
  async save(collectionName, id, data, businessId = null) {
    const saved = localDb.save(collectionName, id, data, false, businessId);
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        let docRef;
        if (!businessId || collectionName === 'users' || collectionName === 'businesses') {
          docRef = doc(dbFirestore, collectionName, id);
        } else {
          docRef = doc(dbFirestore, `businesses/${businessId}/${collectionName}`, id);
        }
        const clean = { ...data };
        delete clean.id;
        setDoc(docRef, clean, { merge: true }).catch(() => {});
      } catch (_) {}
    }
    return saved;
  }

  // Find a single item by ID (Cache-First, background revalidate)
  async getById(collectionName, id, businessId = null) {
    const cached = localDb.get(collectionName, id);
    if (cached) {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        setTimeout(async () => {
          try {
            let docRef;
            if (!businessId || collectionName === 'users' || collectionName === 'businesses') {
              docRef = doc(dbFirestore, collectionName, id);
            } else {
              docRef = doc(dbFirestore, `businesses/${businessId}/${collectionName}`, id);
            }
            const d = await this._withTimeout(getDoc(docRef), 4000);
            if (d && d.exists()) {
              localDb.save(collectionName, d.id, { id: d.id, ...d.data() }, false, businessId);
            }
          } catch (e) {}
        }, 0);
      }
      return cached;
    }

    try {
      let docRef;
      if (!businessId || collectionName === 'users' || collectionName === 'businesses') {
        docRef = doc(dbFirestore, collectionName, id);
      } else {
        docRef = doc(dbFirestore, `businesses/${businessId}/${collectionName}`, id);
      }
      
      const d = await this._withTimeout(getDoc(docRef), 3500);
      if (d && d.exists()) {
        const record = { id: d.id, ...d.data() };
        localDb.save(collectionName, d.id, record, false, businessId);
        return record;
      }
      
      return null;
    } catch (e) {
      return localDb.get(collectionName, id) || null;
    }
  }

  // Add a new item (Offline-First + Immediate Cloud Broadcast)
  async add(collectionName, item, businessId = null, customId = null) {
    const id = customId || uuidv4();
    const newItem = {
      ...item,
      id,
      createdAt: new Date().toISOString()
    };
    
    if (businessId && collectionName !== 'users' && collectionName !== 'businesses') {
      newItem.businessId = businessId;
    }

    const savedLocal = localDb.save(collectionName, id, newItem, true, businessId);

    // Direct cloud push so the other device (laptop/phone) sees it immediately
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        let docRef;
        if (!businessId || collectionName === 'users' || collectionName === 'businesses') {
          docRef = doc(dbFirestore, collectionName, id);
        } else {
          docRef = doc(dbFirestore, `businesses/${businessId}/${collectionName}`, id);
        }
        const cleanData = { ...newItem };
        delete cleanData.id;
        delete cleanData._businessId;
        delete cleanData._syncStatus;
        delete cleanData._localUpdatedAt;
        setDoc(docRef, cleanData, { merge: true }).catch(() => {});
      } catch (_) {}
    }

    this.syncPendingQueue();
    return savedLocal;
  }

  // Update an existing item
  async update(collectionName, id, updates, businessId = null) {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const existing = localDb.get(collectionName, id) || {};
    const merged = { ...existing, ...updateData };
    const savedLocal = localDb.save(collectionName, id, merged, true, businessId);

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        let docRef;
        if (!businessId || collectionName === 'users' || collectionName === 'businesses') {
          docRef = doc(dbFirestore, collectionName, id);
        } else {
          docRef = doc(dbFirestore, `businesses/${businessId}/${collectionName}`, id);
        }
        const cleanData = { ...merged };
        delete cleanData.id;
        delete cleanData._businessId;
        delete cleanData._syncStatus;
        delete cleanData._localUpdatedAt;
        setDoc(docRef, cleanData, { merge: true }).catch(() => {});
      } catch (_) {}
    }

    this.syncPendingQueue();
    return savedLocal;
  }

  // Delete an item
  async delete(collectionName, id, businessId = null) {
    localDb.remove(collectionName, id, true, businessId);
    
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        let docRef;
        if (!businessId || collectionName === 'users' || collectionName === 'businesses') {
          docRef = doc(dbFirestore, collectionName, id);
        } else {
          docRef = doc(dbFirestore, `businesses/${businessId}/${collectionName}`, id);
        }
        deleteDoc(docRef).catch(() => {});
      } catch (_) {}
    }

    this.syncPendingQueue();
    return true;
  }

  async getUserByFirebaseUid(firebaseUid) {
    const cachedUser = localDb.get('users', firebaseUid);
    if (cachedUser) {
      setTimeout(async () => {
        try {
          const docRef = doc(dbFirestore, 'users', firebaseUid);
          const d = await this._withTimeout(getDoc(docRef), 4000);
          if (d && d.exists()) {
            localDb.save('users', d.id, { id: d.id, ...d.data() }, false);
          }
        } catch (e) {}
      }, 0);
      return cachedUser;
    }

    try {
      const docRef = doc(dbFirestore, 'users', firebaseUid);
      const d = await this._withTimeout(getDoc(docRef), 4000);
      if (d.exists()) {
        const record = { id: d.id, ...d.data() };
        localDb.save('users', d.id, record, false);
        return record;
      }
      return null;
    } catch (e) {
      const cached = localDb.get('users', firebaseUid);
      if (cached) return cached;
      throw new Error("Network error: Could not verify account data (" + e.message + ")");
    }
  }
  // Record administrative or high-impact actions into audit trail
  async logAudit(action, details, user = null, businessId = null) {
    try {
      const activeBiz = businessId || (typeof localStorage !== 'undefined' ? localStorage.getItem('karobaar-active-business') : null) || 'demo-business-1';
      const auditRecord = {
        action,
        details,
        userId: user?.id || user?.uid || 'system',
        userName: user?.name || user?.email || 'System / Staff',
        userRole: user?.role || 'STAFF',
        timestamp: new Date().toISOString()
      };
      return await this.add('audit_logs', auditRecord, activeBiz);
    } catch (e) {
      console.warn('Audit log write skipped:', e.message);
    }
  }
}

export const db = new DatabaseService();
