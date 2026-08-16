import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { dbFirestore } from './firebase';
import { localDb } from './localDb';
import { v4 as uuidv4 } from 'uuid'; // Need UUID for offline creation

/**
 * Offline-First Database Service wrapping Firestore with strict multi-tenant isolation.
 */
class DatabaseService {

  constructor() {
    this.syncInProgress = false;
    // Auto-start sync loop
    this._startSyncLoop();
  }

  // --- Core Sync Logic ---
  
  async _startSyncLoop() {
    setInterval(() => {
      if (navigator.onLine) {
        this.syncPendingQueue();
      }
    }, 15000); // Check every 15 seconds
    
    window.addEventListener('online', () => {
      this.syncPendingQueue();
    });
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
        delete cleanData.id; // Firestore handles ID in docRef

        if (item.operation === 'SET') {
          await this._withTimeout(setDoc(docRef, cleanData), 8000);
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
  async _withTimeout(promise, ms = 5000) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('connection-blocked'));
      }, ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
  }

  // --- Data Access Methods ---
  
  // Internal/Global collections
  async getRawCollection(collectionName) {
    try {
      const q = collection(dbFirestore, collectionName);
      const snapshot = await this._withTimeout(getDocs(q));
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      localDb.bulkSave(collectionName, records);
      return records;
    } catch (e) {
      console.warn(`[OFFLINE] Using local cache for ${collectionName}`);
      return localDb.getAll(collectionName);
    }
  }

  // Get a collection filtered by businessId
  async getCollection(collectionName, businessId = null) {
    if (!businessId || collectionName === 'users' || collectionName === 'businesses') {
      return this.getRawCollection(collectionName);
    }
    
    try {
      const q = collection(dbFirestore, `businesses/${businessId}/${collectionName}`);
      const snapshot = await this._withTimeout(getDocs(q));
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      localDb.bulkSave(collectionName, records, businessId);
      return records;
    } catch (e) {
      console.warn(`[OFFLINE] Using local cache for businesses/${businessId}/${collectionName}`);
      return localDb.getAll(collectionName, businessId);
    }
  }

  // Find a single item by ID
  async getById(collectionName, id, businessId = null) {
    try {
      let docRef;
      if (!businessId || collectionName === 'users' || collectionName === 'businesses') {
        docRef = doc(dbFirestore, collectionName, id);
      } else {
        docRef = doc(dbFirestore, `businesses/${businessId}/${collectionName}`, id);
      }
      
      const d = await this._withTimeout(getDoc(docRef));
      if (d.exists()) {
        const record = { id: d.id, ...d.data() };
        localDb.save(collectionName, d.id, record, false, businessId);
        return record;
      }
      return null;
    } catch (e) {
      console.warn(`[OFFLINE] Using local cache for ${collectionName}/${id}`);
      return localDb.get(collectionName, id);
    }
  }

  // Add a new item (Offline-First)
  async add(collectionName, item, businessId = null, customId = null) {
    const id = customId || uuidv4();
    const newItem = {
      ...item,
      createdAt: new Date().toISOString()
    };
    
    if (businessId && collectionName !== 'users' && collectionName !== 'businesses') {
      newItem.businessId = businessId;
    }

    // 1. Save locally immediately
    const savedLocal = localDb.save(collectionName, id, newItem, true, businessId);

    // 2. Try Firestore immediately but don't block on error
    this.syncPendingQueue();

    return savedLocal;
  }

  // Update an existing item
  async update(collectionName, id, updates, businessId = null) {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Get existing to merge locally
    const existing = localDb.get(collectionName, id) || {};
    const merged = { ...existing, ...updateData };

    // 1. Save locally
    const savedLocal = localDb.save(collectionName, id, merged, true, businessId);

    // 2. Try sync
    this.syncPendingQueue();

    return savedLocal;
  }

  // Delete an item
  async delete(collectionName, id, businessId = null) {
    // 1. Delete locally and queue
    localDb.remove(collectionName, id, true, businessId);

    // 2. Try sync
    this.syncPendingQueue();

    return true;
  }

  // --- Specialized Queries ---
  
  // Find user by Firebase Auth UID
  async getUserByFirebaseUid(firebaseUid) {
    try {
      const docRef = doc(dbFirestore, 'users', firebaseUid);
      // Use a longer timeout for this critical auth query
      const d = await this._withTimeout(getDoc(docRef), 15000);
      if (d.exists()) {
        const record = { id: d.id, ...d.data() };
        localDb.save('users', d.id, record, false);
        return record;
      }
      return null; // Explicitly does not exist
    } catch (e) {
      console.warn("[OFFLINE] Using local cache for user profile:", e.message);
      const cachedUser = localDb.get('users', firebaseUid);
      if (cachedUser) {
        return cachedUser;
      }
      // CRITICAL FIX: If no cache and network fails, DO NOT return null (which implies new user).
      // Throw error so AppContext drops them back to login instead of forcing setup.
      throw new Error("Network error: Could not verify account data. Please check your internet connection.");
    }
  }
}

export const db = new DatabaseService();
