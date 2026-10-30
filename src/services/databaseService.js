import { collection, collectionGroup, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { dbFirestore } from './firebase.js';
import { localDb } from './localDb.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Offline-First Database Service wrapping Firestore with strict multi-tenant isolation
 * and multi-device cloud synchronization (Laptop <-> Mobile).
 */
class DatabaseService {

  constructor() {
    this.syncInProgress = false;
    this._realtimeUnsubs = [];
    this._activeRealtimeBiz = null;
    this._startSyncLoop();
  }

  // --- Core Sync Logic (1-second auto-sync + multi-device real-time sync) ---
  
  async _startSyncLoop() {
    // 1-second auto-sync for any pending local mutations
    setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        this.syncPendingQueue();
      }
    }, 1000);

    // Periodic cloud poll safety-net
    setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const activeBizId = typeof localStorage !== 'undefined' ? (localStorage.getItem('karobaar-active-business') || '') : '';
        if (activeBizId && !activeBizId.startsWith('demo-')) {
          this.syncAllFromCloud(activeBizId);
        }
      }
    }, 8000);
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.syncPendingQueue();
        const activeBizId = localStorage.getItem('karobaar-active-business') || '';
        if (activeBizId && !activeBizId.startsWith('demo-')) {
          this.syncAllFromCloud(activeBizId);
        }
      });
    }
  }

  // Start real-time Firestore collection listeners for immediate cross-device sync (Mobile <-> PC <-> Tablet)
  startRealtimeSync(businessId) {
    if (!businessId || String(businessId).startsWith('demo-') || typeof window === 'undefined') return;
    if (this._activeRealtimeBiz === businessId && this._realtimeUnsubs?.length > 0) return;
    this._activeRealtimeBiz = businessId;

    if (this._realtimeUnsubs) {
      this._realtimeUnsubs.forEach(unsub => {
        try { unsub(); } catch (_) {}
      });
    }
    this._realtimeUnsubs = [];

    const syncCollections = ['products', 'sales', 'customers', 'expenses', 'invoices', 'inventory', 'tasks'];
    syncCollections.forEach(col => {
      try {
        const colRef = collection(dbFirestore, `businesses/${businessId}/${col}`);
        const unsub = onSnapshot(colRef, (snapshot) => {
          if (snapshot && !snapshot.empty) {
            const records = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            localDb.bulkSave(col, records, businessId);
            window.dispatchEvent(new CustomEvent('karobaar_data_synced', { detail: { businessId, collection: col } }));
            window.dispatchEvent(new CustomEvent('karobaar_sync_update'));
          }
        }, () => {});
        this._realtimeUnsubs.push(unsub);
      } catch (e) {
        console.warn(`[Snapshot attach note for ${col}]:`, e.message);
      }
    });
  }

  // Find all businesses owned by or associated with a user across devices
  async getBusinessesForUser(userId, userEmail = null) {
    const allLocal = localDb.getAll('businesses') || [];
    let matches = allLocal.filter(b => 
      b && 
      !String(b.id).startsWith('demo-') && 
      !String(b.id).includes('demo') && 
      (b.ownerId === userId || (userEmail && b.ownerEmail && b.ownerEmail.toLowerCase() === userEmail.toLowerCase()))
    );

    // Also include businesses from user memberships (for invited team members e.g. Cashiers, Managers)
    try {
      const userDoc = (await this.getById('users', userId)) || localDb.get('users', userId) || {};
      const memberships = Array.isArray(userDoc.memberships) ? [...userDoc.memberships] : [];
      
      const activeBizId = typeof localStorage !== 'undefined' ? localStorage.getItem('karobaar-active-business') : null;
      if (activeBizId && !memberships.includes(activeBizId) && !String(activeBizId).startsWith('demo-')) {
        memberships.push(activeBizId);
      }

      for (const bizId of memberships) {
        if (!matches.some(m => m.id === bizId)) {
          const biz = (await this.getById('businesses', bizId)) || localDb.get('businesses', bizId);
          if (biz) {
            localDb.save('businesses', biz.id, biz);
            matches.push(biz);
          }
        }
      }
    } catch (e) {
      console.warn('[getBusinessesForUser memberships note]', e);
    }

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        // Query 1: by ownerId
        if (userId) {
          const q1 = query(collection(dbFirestore, 'businesses'), where('ownerId', '==', userId));
          const snap1 = await this._withTimeout(getDocs(q1), 4000).catch(() => null);
          if (snap1 && !snap1.empty) {
            snap1.docs.forEach(docSnap => {
              const data = { id: docSnap.id, ...docSnap.data() };
              localDb.save('businesses', docSnap.id, data);
              if (!matches.some(m => m.id === docSnap.id)) matches.push(data);
            });
          }
        }

        // Query 2: by ownerEmail
        if (userEmail) {
          const cleanEmail = userEmail.toLowerCase().trim();
          const q2 = query(collection(dbFirestore, 'businesses'), where('ownerEmail', '==', cleanEmail));
          const snap2 = await this._withTimeout(getDocs(q2), 4000).catch(() => null);
          if (snap2 && !snap2.empty) {
            snap2.docs.forEach(docSnap => {
              const data = { id: docSnap.id, ...docSnap.data() };
              localDb.save('businesses', docSnap.id, data);
              if (!matches.some(m => m.id === docSnap.id)) matches.push(data);
            });
          }
        }
      } catch (e) {
        console.warn('[getBusinessesForUser Cloud Note]', e);
      }
    }

    // Resilient Fallback: If no match found by ownerId or email, check if there is an active business in localStorage or a non-demo business in localDb
    if (matches.length === 0) {
      const activeBizId = typeof localStorage !== 'undefined' ? localStorage.getItem('karobaar-active-business') : null;
      if (activeBizId) {
        const activeBiz = allLocal.find(b => b && b.id === activeBizId && !String(b.id).startsWith('demo-'));
        if (activeBiz) {
          if (userId && !activeBiz.ownerId) activeBiz.ownerId = userId;
          matches.push(activeBiz);
        }
      }
      if (matches.length === 0) {
        const localRealBiz = allLocal.find(b => b && !String(b.id).startsWith('demo-') && !String(b.id).includes('demo') && b.name && b.name !== 'My Business' && b.name !== 'My Store');
        if (localRealBiz) {
          if (userId && !localRealBiz.ownerId) localRealBiz.ownerId = userId;
          matches.push(localRealBiz);
        }
      }
    }

    return matches;
  }

  // Two-way synchronization: Pull latest records from Firestore so Laptop & Mobile stay in sync
  async syncAllFromCloud(businessId = 'demo-business-1') {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    if (this.syncInProgress) return;

    const collectionsToSync = ['products', 'sales', 'customers', 'expenses', 'suppliers', 'invoices', 'employees', 'purchases', 'stock_movements', 'audit_logs', 'members', 'invitations', 'device_sessions'];
    
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

        // Recursively clean undefined, internal sync fields, and id
        const cleanData = this._cleanDataForFirestore(item.data) || {};

        // Truncate or omit huge base64 images that exceed Firestore 1MB document boundary
        if (cleanData.imageUrl && typeof cleanData.imageUrl === 'string' && cleanData.imageUrl.length > 700000) {
          delete cleanData.imageUrl;
        }

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

  // Recursive sanitize data for Firestore (strips undefined, internal sync fields, and id)
  _cleanDataForFirestore(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) {
      return obj
        .map(item => this._cleanDataForFirestore(item))
        .filter(item => item !== undefined);
    }
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (
        key === 'id' ||
        key === '_businessId' ||
        key === '_syncStatus' ||
        key === '_localUpdatedAt' ||
        value === undefined
      ) {
        continue;
      }
      cleaned[key] = (typeof value === 'object' && value !== null)
        ? this._cleanDataForFirestore(value)
        : value;
    }
    return cleaned;
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
        const clean = this._cleanDataForFirestore(data);
        await this._withTimeout(setDoc(docRef, clean, { merge: true }), 4000).catch(err => {
          console.warn(`[Cloud Save Note] ${collectionName}/${id}:`, err?.message || err);
        });
      } catch (_) {}
    }
    return saved;
  }

  // Find a single item by ID (Cache-First, background revalidate)
  async getById(collectionName, id, businessId = null) {
    const cached = localDb.get(collectionName, id);
    if (cached) {
      if (typeof navigator !== 'undefined' && navigator.onLine && !String(id).startsWith('demo-')) {
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

    // Skip cloud query for demo entities
    if (id && String(id).startsWith('demo-')) {
      return null;
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
    if (!String(id).startsWith('demo-') && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        let docRef;
        if (!businessId || collectionName === 'users' || collectionName === 'businesses') {
          docRef = doc(dbFirestore, collectionName, id);
        } else {
          docRef = doc(dbFirestore, `businesses/${businessId}/${collectionName}`, id);
        }
        const cleanData = this._cleanDataForFirestore(newItem);
        await this._withTimeout(setDoc(docRef, cleanData, { merge: true }), 4000).catch(err => {
          console.warn(`[Cloud Add Note] ${collectionName}/${id}:`, err?.message || err);
        });
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

    let existing = localDb.get(collectionName, id);
    if (!existing) {
      existing = (await this.getById(collectionName, id, businessId)) || {};
    }
    const merged = { ...existing, ...updateData };
    const savedLocal = localDb.save(collectionName, id, merged, true, businessId);

    if (!String(id).startsWith('demo-') && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        let docRef;
        if (!businessId || collectionName === 'users' || collectionName === 'businesses') {
          docRef = doc(dbFirestore, collectionName, id);
        } else {
          docRef = doc(dbFirestore, `businesses/${businessId}/${collectionName}`, id);
        }
        const cleanData = this._cleanDataForFirestore(merged);
        await this._withTimeout(setDoc(docRef, cleanData, { merge: true }), 4000).catch(err => {
          console.warn(`[Cloud Update Note] ${collectionName}/${id}:`, err?.message || err);
        });
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

  // ==========================================
  // MULTI-USER & TEAM MANAGEMENT METHODS
  // ==========================================

  /**
   * Retrieve all active and registered members of a business
   */
  async getBusinessMembers(businessId) {
    if (!businessId) return [];
    let members = await this.getCollection('members', businessId);
    
    // Fallback seed for demo-business-1 if members collection is not yet populated
    if ((!members || members.length === 0) && businessId === 'demo-business-1') {
      const defaultMembers = [
        {
          id: 'demo-user-1',
          userId: 'demo-user-1',
          name: 'Store Owner',
          email: 'owner@karobaar.app',
          phone: '',
          role: 'Owner',
          permissions: [],
          status: 'active',
          isEmailVerified: true,
          isPhoneVerified: true,
          joinedAt: '2026-01-15T09:00:00.000Z',
          businessId: 'demo-business-1'
        },
        {
          id: 'demo-manager-1',
          userId: 'demo-manager-1',
          name: 'Rahul Sharma',
          email: 'rahul.manager@karobaar.app',
          phone: '+91 98765 11111',
          role: 'Manager',
          permissions: [],
          status: 'active',
          isEmailVerified: true,
          isPhoneVerified: false,
          joinedAt: '2026-02-01T10:30:00.000Z',
          businessId: 'demo-business-1'
        },
        {
          id: 'demo-cashier-1',
          userId: 'demo-cashier-1',
          name: 'Priya Patel',
          email: 'priya.cashier@karobaar.app',
          phone: '+91 98765 22222',
          role: 'Cashier',
          permissions: [],
          status: 'active',
          isEmailVerified: false,
          isPhoneVerified: true,
          joinedAt: '2026-03-10T14:15:00.000Z',
          businessId: 'demo-business-1'
        }
      ];
      await this.saveCollection('members', defaultMembers, businessId);
      return defaultMembers;
    }

    return members || [];
  }

  /**
   * Add a new member to a business
   */
  async addBusinessMember(businessId, memberData, customId = null) {
    const memberId = customId || memberData.userId || uuidv4();
    const newMember = {
      ...memberData,
      id: memberId,
      businessId,
      status: memberData.status || 'active',
      joinedAt: memberData.joinedAt || new Date().toISOString()
    };
    const saved = await this.save('members', memberId, newMember, businessId);
    await this.logAudit('MEMBER_ADDED', `Added team member '${newMember.name || newMember.email}' with role '${newMember.role}'`, null, businessId);
    return saved;
  }

  /**
   * Update a member's role, status, or granular permissions
   */
  async updateBusinessMember(businessId, memberId, updates, userContext = null) {
    const updated = await this.update('members', memberId, updates, businessId);
    const changeDesc = updates.role ? `role to '${updates.role}'` : updates.status ? `status to '${updates.status}'` : 'permissions';
    await this.logAudit('MEMBER_UPDATED', `Updated team member #${memberId} ${changeDesc}`, userContext, businessId);
    return updated;
  }

  /**
   * Remove a member from a business
   */
  async removeBusinessMember(businessId, memberId, userContext = null) {
    await this.delete('members', memberId, businessId);
    await this.logAudit('MEMBER_REMOVED', `Removed team member #${memberId} from business`, userContext, businessId);
    return true;
  }

  /**
   * Generate an official team invitation with secure unique token/code
   */
  async createInvitation(businessId, inviteData, userContext = null) {
    const inviteId = uuidv4();
    // Generate clean readable token like KB-INV-9X7P
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const inviteCode = `KB-INV-${randomSuffix}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const invitation = {
      id: inviteId,
      code: inviteCode,
      businessId,
      businessName: inviteData.businessName || 'Business',
      email: (inviteData.email || '').trim().toLowerCase(),
      phone: (inviteData.phone || '').trim(),
      role: inviteData.role || 'Cashier',
      permissions: Array.isArray(inviteData.permissions) ? inviteData.permissions : [],
      status: 'pending', // 'pending' | 'accepted' | 'revoked' | 'expired'
      notes: inviteData.notes || '',
      invitedByUid: userContext?.id || userContext?.uid || 'owner',
      invitedByName: userContext?.name || userContext?.email || 'Business Owner',
      createdAt: new Date().toISOString(),
      expiresAt
    };

    // 1. Save in local database: indexed by ID, by code, and for business
    localDb.save('invitations', inviteId, invitation, false, businessId);
    localDb.save('invitation_codes', inviteCode, invitation, false);

    // Multi-key storage for zero-friction cross-window and cross-tab detection
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`karobaar_invite_${inviteCode}`, JSON.stringify(invitation));
        localStorage.setItem(`karobaar_invite_${inviteId}`, JSON.stringify(invitation));
        let allMap = {};
        try {
          allMap = JSON.parse(localStorage.getItem('karobaar_all_invitations') || '{}');
        } catch (_) {}
        allMap[inviteCode] = invitation;
        allMap[inviteId] = invitation;
        localStorage.setItem('karobaar_all_invitations', JSON.stringify(allMap));
      }
    } catch (_) {}

    // Multi-process LocalServer & Dev server relay (accessible to all windows/browsers)
    if (typeof window !== 'undefined') {
      try {
        const curPort = window.location.port;
        const candidatePorts = [curPort, '5173', '5174', '5000', '8080'].filter(Boolean);
        const uniquePorts = Array.from(new Set(candidatePorts));
        const targets = ['/api/invitations'];
        uniquePorts.forEach(p => {
          targets.push(`http://localhost:${p}/api/invitations`);
        });
        targets.forEach(url => {
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invitation)
          }).catch(() => {});
        });
      } catch (_) {}
    }

    // 2. Save in Cloud Firestore across both top-level and business subcollections
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const clean = this._cleanDataForFirestore(invitation);

        // A. Top-level invitations collection keyed by inviteCode for instant O(1) cross-device lookup
        const topCodeRef = doc(dbFirestore, 'invitations', inviteCode);
        await this._withTimeout(setDoc(topCodeRef, clean, { merge: true }), 4000).catch(err => {
          console.warn('[Cloud Invite Code Note]:', err?.message || err);
        });

        // B. Top-level invitations collection keyed by inviteId
        const topIdRef = doc(dbFirestore, 'invitations', inviteId);
        await this._withTimeout(setDoc(topIdRef, clean, { merge: true }), 4000).catch(() => {});

        // C. Tenant subcollection for owner's team list
        if (businessId) {
          const bizRef = doc(dbFirestore, `businesses/${businessId}/invitations`, inviteId);
          await this._withTimeout(setDoc(bizRef, clean, { merge: true }), 4000).catch(() => {});
        }
      } catch (e) {
        console.warn('[createInvitation Cloud Save Error]:', e);
      }
    }

    await this.logAudit('INVITATION_SENT', `Invited ${invitation.email || invitation.phone} as '${invitation.role}' (Code: ${inviteCode})`, userContext, businessId);
    return invitation;
  }

  /**
   * Retrieve all invitations for a business
   */
  async getBusinessInvitations(businessId) {
    if (!businessId) return [];
    const all = await this.getCollection('invitations', businessId);
    const now = new Date();
    // Auto-mark expired ones in memory
    return (all || []).map(inv => {
      if (inv.status === 'pending' && inv.expiresAt && new Date(inv.expiresAt) < now) {
        return { ...inv, status: 'expired' };
      }
      return inv;
    });
  }

  /**
   * Find an invitation by its code or ID across local memory and cloud
   */
  async getInvitationByCode(rawCode) {
    if (!rawCode) return null;
    
    // Normalize and clean raw code (handles URL paste e.g. https://.../#/setup?join=KB-INV-XXXXX)
    let cleanCode = String(rawCode).trim().toUpperCase();
    if (cleanCode.includes('JOIN=')) {
      cleanCode = cleanCode.split('JOIN=')[1].split('&')[0];
    }
    if (cleanCode.includes('#/SETUP?JOIN=')) {
      cleanCode = cleanCode.split('#/SETUP?JOIN=')[1].split('&')[0];
    }
    cleanCode = decodeURIComponent(cleanCode).trim();
    if (!cleanCode) return null;

    const noHyphens = cleanCode.replace(/[^A-Z0-9]/g, '');
    const coreSuffix = cleanCode.replace(/^(KB-INV-|KB-)/, '').replace(/[^A-Z0-9]/g, '');

    const isMatch = (cand) => {
      if (!cand) return false;
      const c = String(cand.code || cand.id || '').toUpperCase();
      if (!c) return false;
      const candNoHyphens = c.replace(/[^A-Z0-9]/g, '');
      const candSuffix = c.replace(/^(KB-INV-|KB-)/, '').replace(/[^A-Z0-9]/g, '');
      return (
        c === cleanCode ||
        cand.id === cleanCode ||
        candNoHyphens === noHyphens ||
        (coreSuffix && candSuffix === coreSuffix) ||
        (coreSuffix.length >= 4 && candSuffix.endsWith(coreSuffix))
      );
    };

    // 1. Direct browser localStorage checks (covers multi-window & multi-tab)
    if (typeof localStorage !== 'undefined') {
      try {
        const rawDirect = localStorage.getItem(`karobaar_invite_${cleanCode}`);
        if (rawDirect) {
          const parsed = JSON.parse(rawDirect);
          if (parsed && isMatch(parsed)) return parsed;
        }

        const allMap = JSON.parse(localStorage.getItem('karobaar_all_invitations') || '{}');
        if (allMap[cleanCode] && isMatch(allMap[cleanCode])) return allMap[cleanCode];

        for (const k of Object.keys(allMap)) {
          if (isMatch(allMap[k])) {
            return allMap[k];
          }
        }
      } catch (_) {}
    }

    // 1b. Fast LocalServer & Dev Relay Lookup (bridges separate browser profiles, WebView2, ports & processes)
    if (typeof window !== 'undefined') {
      try {
        const curPort = window.location.port;
        const candidatePorts = [curPort, '5173', '5174', '5000', '8080'].filter(Boolean);
        const uniquePorts = Array.from(new Set(candidatePorts));
        const lookupTargets = [];
        
        lookupTargets.push(`/api/invitations?code=${encodeURIComponent(cleanCode)}`);
        if (coreSuffix && coreSuffix !== cleanCode) {
          lookupTargets.push(`/api/invitations?code=${encodeURIComponent(coreSuffix)}`);
        }
        uniquePorts.forEach(p => {
          lookupTargets.push(`http://localhost:${p}/api/invitations?code=${encodeURIComponent(cleanCode)}`);
          if (coreSuffix && coreSuffix !== cleanCode) {
            lookupTargets.push(`http://localhost:${p}/api/invitations?code=${encodeURIComponent(coreSuffix)}`);
          }
        });

        for (const url of lookupTargets) {
          try {
            const res = await this._withTimeout(fetch(url), 1200).catch(() => null);
            if (res && res.ok) {
              const data = await res.json().catch(() => null);
              if (data && data.success && data.invitation) {
                const found = data.invitation;
                localDb.save('invitation_codes', cleanCode, found, false);
                localDb.save('invitation_codes', found.code, found, false);
                if (found.businessId) {
                  localDb.save('invitations', found.id || cleanCode, found, false, found.businessId);
                }
                return found;
              }
            }
          } catch (_) {}
        }
      } catch (_) {}
    }

    // 2. Embedded payload fallback from invitation URL
    try {
      const rawStr = String(rawCode);
      if (rawStr.toUpperCase().includes('DATA=')) {
        const parts = rawStr.split(/DATA=/i)[1].split('&')[0];
        const decoded = JSON.parse(decodeURIComponent(parts));
        if (decoded && decoded.b) {
          return {
            id: `inv_${cleanCode}`,
            code: cleanCode,
            businessId: decoded.b,
            businessName: decoded.n || 'Business Workspace',
            role: decoded.r || 'Cashier',
            permissions: decoded.p || [],
            status: 'pending',
            invitedByName: 'Business Owner',
            createdAt: new Date().toISOString()
          };
        }
      }
    } catch (_) {}

    // 3. Fast lookup from local memory index
    const indexed = localDb.get('invitation_codes', cleanCode);
    if (indexed && isMatch(indexed)) return indexed;

    // 4. Search all local invitations
    const allInvitations = localDb.getAll('invitations');
    const matched = allInvitations.find(inv => isMatch(inv));
    if (matched) return matched;

    // 4b. Check all businesses in localDb
    const allBusinesses = localDb.getAll('businesses') || [];
    for (const b of allBusinesses) {
      if (b && b.id) {
        const bizInvs = localDb.getAll('invitations', b.id) || [];
        const foundBizInv = bizInvs.find(inv => isMatch(inv));
        if (foundBizInv) return foundBizInv;
      }
    }

    // 5. Cloud Firestore Direct Document Fetch: invitations/${cleanCode} (Instant O(1) cross-device)
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        // Direct document ID lookup
        const docRef = doc(dbFirestore, 'invitations', cleanCode);
        const docSnap = await this._withTimeout(getDoc(docRef), 3500).catch(() => null);
        if (docSnap && docSnap.exists()) {
          const found = { id: docSnap.id, ...docSnap.data() };
          localDb.save('invitation_codes', cleanCode, found, false);
          if (found.businessId) {
            localDb.save('invitations', found.id || cleanCode, found, false, found.businessId);
          }
          return found;
        }

        // Try with KB-INV- prefix if missing
        if (!cleanCode.startsWith('KB-INV-') && coreSuffix) {
          const altDocRef = doc(dbFirestore, 'invitations', `KB-INV-${coreSuffix}`);
          const altSnap = await this._withTimeout(getDoc(altDocRef), 2500).catch(() => null);
          if (altSnap && altSnap.exists()) {
            const found = { id: altSnap.id, ...altSnap.data() };
            localDb.save('invitation_codes', cleanCode, found, false);
            return found;
          }
        }

        // Top-level query by 'code' field
        const q1 = query(collection(dbFirestore, 'invitations'), where('code', '==', cleanCode));
        const snap1 = await this._withTimeout(getDocs(q1), 3500).catch(() => null);
        if (snap1 && !snap1.empty) {
          const found = { id: snap1.docs[0].id, ...snap1.docs[0].data() };
          localDb.save('invitation_codes', cleanCode, found, false);
          if (found.businessId) {
            localDb.save('invitations', found.id || cleanCode, found, false, found.businessId);
          }
          return found;
        }

        // CollectionGroup across all tenant subcollections
        const q2 = query(collectionGroup(dbFirestore, 'invitations'), where('code', '==', cleanCode));
        const snap2 = await this._withTimeout(getDocs(q2), 3500).catch(() => null);
        if (snap2 && !snap2.empty) {
          const found = { id: snap2.docs[0].id, ...snap2.docs[0].data() };
          localDb.save('invitation_codes', cleanCode, found, false);
          if (found.businessId) {
            localDb.save('invitations', found.id || cleanCode, found, false, found.businessId);
          }
          return found;
        }
      } catch (e) {
        console.warn('[getInvitationByCode Cloud Note]:', e);
      }
    }

    return null;
  }

  /**
   * Accept an invitation and bind member to business
   */
  async acceptInvitation(rawCode, user) {
    if (!rawCode) throw new Error("Please enter an invitation code.");
    let cleanCode = String(rawCode).trim().toUpperCase();
    if (cleanCode.includes('JOIN=')) {
      cleanCode = cleanCode.split('JOIN=')[1].split('&')[0];
    }
    cleanCode = cleanCode.trim();

    const invite = await this.getInvitationByCode(cleanCode);
    if (!invite) {
      throw new Error("Invitation not found. Please verify the invitation code or link.");
    }
    if (invite.status === 'revoked') {
      throw new Error("This invitation has been revoked by the business owner.");
    }
    if (invite.status === 'accepted') {
      throw new Error("This invitation has already been accepted.");
    }
    const isExpired = invite.expiresAt && new Date(invite.expiresAt) < new Date();
    if (isExpired || invite.status === 'expired') {
      throw new Error("This invitation code has expired. Please request a new invite from the owner.");
    }

    const businessId = invite.businessId;
    const targetUserId = user?.uid || user?.id || `user_${Date.now()}`;
    const targetName = user?.name || user?.displayName || user?.email?.split('@')[0] || 'Team Member';

    // 1. Create or update member in business
    const memberRecord = {
      id: targetUserId,
      userId: targetUserId,
      name: targetName,
      email: user?.email || invite.email || '',
      phone: user?.phoneNumber || user?.phone || invite.phone || '',
      role: invite.role,
      permissions: invite.permissions || [],
      status: 'active',
      joinedAt: new Date().toISOString(),
      invitedBy: invite.invitedByName,
      businessId
    };
    await this.save('members', targetUserId, memberRecord, businessId);

    // 2. Mark invitation as accepted across all stores
    const updatedInvite = {
      ...invite,
      status: 'accepted',
      acceptedByUid: targetUserId,
      acceptedByName: targetName,
      acceptedAt: new Date().toISOString()
    };
    await this.save('invitations', invite.id, updatedInvite, businessId);
    localDb.save('invitation_codes', invite.code, updatedInvite, false);
    localDb.save('invitation_codes', cleanCode, updatedInvite, false);

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`karobaar_invite_${invite.code}`, JSON.stringify(updatedInvite));
        localStorage.setItem(`karobaar_invite_${cleanCode}`, JSON.stringify(updatedInvite));
        let allMap = JSON.parse(localStorage.getItem('karobaar_all_invitations') || '{}');
        allMap[invite.code] = updatedInvite;
        allMap[cleanCode] = updatedInvite;
        localStorage.setItem('karobaar_all_invitations', JSON.stringify(allMap));
      }
    } catch (_) {}

    // Update in Cloud Firestore top-level
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const cleanData = this._cleanDataForFirestore(updatedInvite);
        await setDoc(doc(dbFirestore, 'invitations', invite.code), cleanData, { merge: true }).catch(() => {});
        if (invite.id) {
          await setDoc(doc(dbFirestore, 'invitations', invite.id), cleanData, { merge: true }).catch(() => {});
        }
      } catch (_) {}
    }

    // 3. Update User's record and memberships
    try {
      const existingUser = (await this.getById('users', targetUserId)) || localDb.get('users', targetUserId) || {};
      const currentMemberships = Array.isArray(existingUser.memberships) ? [...existingUser.memberships] : [];
      if (!currentMemberships.includes(businessId)) {
        currentMemberships.push(businessId);
      }
      const updatedUser = {
        ...existingUser,
        id: targetUserId,
        email: user?.email || existingUser.email || invite.email || '',
        name: targetName,
        role: invite.role,
        permissions: invite.permissions || [],
        memberships: currentMemberships,
        activeBusinessId: businessId,
        onboardingCompleted: true
      };
      await this.save('users', targetUserId, updatedUser);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('karobaar_session_user', JSON.stringify(updatedUser));
      }
    } catch (e) {
      console.warn("User membership update note:", e);
    }

    // 4. Update the joined business profile in local storage & session
    try {
      const biz = (await this.getById('businesses', businessId)) || localDb.get('businesses', businessId);
      if (biz && typeof localStorage !== 'undefined') {
        localStorage.setItem('karobaar_session_business', JSON.stringify(biz));
        localStorage.setItem('karobaar-active-business', businessId);
        
        let allBiz = [];
        try {
          allBiz = JSON.parse(localStorage.getItem('karobaar_session_businesses') || '[]');
        } catch (_) {}
        if (!allBiz.some(b => b.id === businessId)) {
          allBiz.push(biz);
          localStorage.setItem('karobaar_session_businesses', JSON.stringify(allBiz));
        }
      }
    } catch (e) {
      console.warn("Business sync on join note:", e);
    }

    // 5. Log Audit Trail
    await this.logAudit('INVITATION_ACCEPTED', `User '${targetName}' accepted invite as '${invite.role}'`, user, businessId);

    return {
      success: true,
      businessId,
      role: invite.role,
      businessName: invite.businessName || 'Business Workspace'
    };
  }

  /**
   * Revoke an active invitation
   */
  async revokeInvitation(businessId, invitationId, userContext = null) {
    const existing = await this.getById('invitations', invitationId, businessId);
    if (!existing) return false;
    const revoked = { ...existing, status: 'revoked', revokedAt: new Date().toISOString() };
    await this.save('invitations', invitationId, revoked, businessId);
    if (existing.code) {
      localDb.save('invitation_codes', existing.code, revoked, false);
    }
    await this.logAudit('INVITATION_REVOKED', `Revoked invitation #${invitationId} for ${existing.email || existing.phone}`, userContext, businessId);
    return true;
  }

  /**
   * Transfer Primary Business Ownership to another active member
   */
  async transferBusinessOwnership(businessId, currentOwnerUid, newOwnerUid, userContext = null) {
    if (!businessId || !currentOwnerUid || !newOwnerUid) {
      throw new Error("Missing parameters for ownership transfer.");
    }
    if (currentOwnerUid === newOwnerUid) {
      throw new Error("Cannot transfer ownership to yourself.");
    }

    const business = await this.getById('businesses', businessId);
    if (!business) throw new Error("Business not found.");

    // Update new owner's member record
    const targetMember = await this.getById('members', newOwnerUid, businessId);
    if (!targetMember) throw new Error("Target member is not registered in this business.");

    await this.update('members', newOwnerUid, { role: 'Owner' }, businessId);

    // Demote previous owner to Manager
    await this.update('members', currentOwnerUid, { role: 'Manager' }, businessId);

    // Update business doc primary ownerId
    await this.update('businesses', businessId, { ownerId: newOwnerUid });

    await this.logAudit('OWNERSHIP_TRANSFERRED', `Business ownership transferred from ${currentOwnerUid} to ${targetMember.name || newOwnerUid}`, userContext, businessId);

    return { success: true, newOwnerName: targetMember.name };
  }

  /**
   * Create a new business and initialize the creator as its Owner
   */
  async createNewBusiness(businessData, ownerUser) {
    const businessId = `biz-${uuidv4().substring(0, 8)}`;
    const ownerUid = ownerUser?.id || ownerUser?.uid || 'demo-user-1';

    const newBusiness = {
      ...businessData,
      id: businessId,
      ownerId: ownerUid,
      createdAt: new Date().toISOString(),
      modules: businessData.modules || {
        pos: true,
        inventory: true,
        orders: true,
        customers: true,
        expenses: true,
        suppliers: true,
        reports: true,
        employees: true,
        invoices: true
      },
      settings: {
        currency: businessData.currency || 'INR',
        theme: 'light',
        taxRate: Number(businessData.taxRate) || 5,
        timezone: businessData.timezone || 'Asia/Kolkata',
        dateFormat: businessData.dateFormat || 'DD/MM/YYYY',
        ...(businessData.settings || {})
      }
    };

    // Save business record
    await this.save('businesses', businessId, newBusiness);

    // Create Owner member record
    const ownerMember = {
      id: ownerUid,
      userId: ownerUid,
      name: ownerUser?.name || 'Owner',
      email: ownerUser?.email || '',
      phone: ownerUser?.phone || '',
      role: 'Owner',
      permissions: [],
      status: 'active',
      isEmailVerified: true,
      joinedAt: new Date().toISOString(),
      businessId
    };
    await this.save('members', ownerUid, ownerMember, businessId);

    // Update owner's user memberships
    try {
      const userDoc = await this.getById('users', ownerUid) || {};
      const memberships = Array.isArray(userDoc.memberships) ? userDoc.memberships : [];
      if (!memberships.includes(businessId)) memberships.push(businessId);
      await this.save('users', ownerUid, {
        ...userDoc,
        id: ownerUid,
        memberships,
        activeBusinessId: businessId
      });
    } catch (e) {}

    await this.logAudit('BUSINESS_CREATED', `Created new business '${newBusiness.name}'`, ownerUser, businessId);

    return newBusiness;
  }

  /**
   * Retrieve all businesses accessible by a user (via ownership or member collection)
   */
  async getUserAuthorizedBusinesses(userId, userEmail = '') {
    const allBusinesses = await this.getRawCollection('businesses');
    const matched = [];

    for (const biz of allBusinesses) {
      if (!biz || !biz.id) continue;
      if (biz.ownerId === userId) {
        matched.push({ ...biz, userRoleInBusiness: 'Owner' });
        continue;
      }
      // Check membership subcollection
      const member = localDb.get('members', userId);
      if (member && member.businessId === biz.id && member.status === 'active') {
        matched.push({ ...biz, userRoleInBusiness: member.role || 'Cashier' });
      }
    }

    if (matched.length === 0) {
      // Default to demo business if nothing found
      const demoBiz = await this.getById('businesses', 'demo-business-1') || {
        id: 'demo-business-1',
        name: 'My Store',
        currency: 'INR',
        userRoleInBusiness: 'Owner'
      };
      return [demoBiz];
    }

    return matched;
  }

  // --- Real Device & Session Tracking ---

  /**
   * Register or heartbeat the current true device session
   */
  async registerDeviceSession(userId, businessId, sessionInfo) {
    if (!sessionInfo || !sessionInfo.id) return null;
    const sessionDoc = {
      id: sessionInfo.id,
      deviceId: sessionInfo.deviceId || sessionInfo.id,
      userId: userId || 'anonymous',
      businessId: businessId || 'demo-business-1',
      name: sessionInfo.name || 'Current Device',
      os: sessionInfo.os || 'Windows PC',
      browser: sessionInfo.browser || 'Google Chrome',
      type: sessionInfo.type || 'desktop',
      ip: sessionInfo.ip || '127.0.0.1 (Localhost)',
      screen: sessionInfo.screen || '1920 × 1080',
      userAgent: sessionInfo.userAgent || '',
      lastActive: new Date().toISOString(),
      lastActiveTime: Date.now(),
      status: 'ACTIVE NOW',
      isRevoked: false,
      isCurrent: true
    };

    // Save to localDb device_sessions
    await this.save('device_sessions', sessionDoc.id, sessionDoc, businessId);

    // Save to Firestore in background
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const docRef = doc(dbFirestore, `businesses/${businessId}/device_sessions`, sessionDoc.id);
        await setDoc(docRef, sessionDoc, { merge: true });
      }
    } catch (e) {
      // offline fallback
    }

    return sessionDoc;
  }

  /**
   * Retrieve active true device sessions for user & business
   */
  async getActiveDeviceSessions(userId, businessId, currentDeviceId) {
    let sessions = [];
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const q = collection(dbFirestore, `businesses/${businessId}/device_sessions`);
        const snap = await this._withTimeout(getDocs(q), 3000);
        if (snap && !snap.empty) {
          sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          localDb.bulkSave('device_sessions', sessions, businessId);
        }
      }
    } catch (e) {}

    if (sessions.length === 0) {
      sessions = localDb.getAll('device_sessions', businessId) || [];
    }

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    // Filter out revoked sessions and legacy fake mockups
    const activeSessions = sessions.filter(s => {
      if (!s || s.isRevoked) return false;
      // Strip out any hardcoded fake mockups
      if (s.id === 'mobile-pwa' || s.id === 'pos-tablet' || s.id === 'laptop-billing') return false;
      if (s.name && (s.name.includes('Samsung Galaxy') || s.name.includes('iPad Counter Register') || s.name.includes('HP Laptop (Manager Office)'))) return false;
      const actTime = s.lastActiveTime || (s.lastActive ? new Date(s.lastActive).getTime() : 0);
      return actTime >= thirtyDaysAgo;
    });

    // Normalize isCurrent flag and status based on real activity
    return activeSessions.map(s => {
      const isCur = s.deviceId === currentDeviceId || s.id === currentDeviceId || s.isCurrent === true;
      const timeDiff = Date.now() - (s.lastActiveTime || (s.lastActive ? new Date(s.lastActive).getTime() : 0));
      let status = 'ONLINE';
      if (isCur || timeDiff < 5 * 60 * 1000) {
        status = 'ACTIVE NOW';
      } else if (timeDiff < 60 * 60 * 1000) {
        status = 'ONLINE';
      } else if (timeDiff < 24 * 60 * 60 * 1000) {
        status = 'STANDBY';
      } else {
        status = 'OFFLINE';
      }

      return {
        ...s,
        isCurrent: isCur,
        status
      };
    });
  }

  /**
   * Revoke a single session
   */
  async revokeDeviceSession(userId, businessId, sessionId) {
    try {
      const existing = localDb.get('device_sessions', sessionId) || {};
      const updated = { ...existing, id: sessionId, isRevoked: true, revokedAt: new Date().toISOString() };
      await this.save('device_sessions', sessionId, updated, businessId);

      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const docRef = doc(dbFirestore, `businesses/${businessId}/device_sessions`, sessionId);
        await setDoc(docRef, { isRevoked: true, revokedAt: new Date().toISOString() }, { merge: true });
      }
    } catch (e) {}
  }

  /**
   * Revoke all other device sessions
   */
  async revokeAllOtherDeviceSessions(userId, businessId, currentDeviceId) {
    const sessions = await this.getActiveDeviceSessions(userId, businessId, currentDeviceId);
    for (const s of sessions) {
      if (s.deviceId !== currentDeviceId && s.id !== currentDeviceId) {
        await this.revokeDeviceSession(userId, businessId, s.id);
      }
    }
  }
}

export const db = new DatabaseService();
