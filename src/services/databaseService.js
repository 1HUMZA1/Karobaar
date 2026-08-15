import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { dbFirestore } from './firebase';

/**
 * Real Database Service wrapping Firestore with strict multi-tenant isolation.
 */
class DatabaseService {
  
  // Internal/Global collections (users, businesses)
  async getRawCollection(collectionName) {
    const q = collection(dbFirestore, collectionName);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Get a collection filtered by businessId (Maps to businesses/{businessId}/{collectionName})
  async getCollection(collectionName, businessId = null) {
    if (!businessId || collectionName === 'users' || collectionName === 'businesses') {
      return this.getRawCollection(collectionName);
    }
    
    // Multi-tenant isolation: /businesses/{businessId}/{collectionName}
    const q = collection(dbFirestore, `businesses/${businessId}/${collectionName}`);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Find a single item by ID
  async getById(collectionName, id, businessId = null) {
    let docRef;
    if (!businessId || collectionName === 'users' || collectionName === 'businesses') {
      docRef = doc(dbFirestore, collectionName, id);
    } else {
      docRef = doc(dbFirestore, `businesses/${businessId}/${collectionName}`, id);
    }
    
    const d = await getDoc(docRef);
    return d.exists() ? { id: d.id, ...d.data() } : null;
  }

  // Helper to prevent hanging promises when ad-blockers intercept Firestore
  async _withTimeout(promise, ms = 10000) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('connection-blocked'));
      }, ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
  }

  // Add a new item
  async add(collectionName, item, businessId = null, customId = null) {
    const newItem = {
      ...item,
      createdAt: new Date().toISOString()
    };
    
    let docRef;
    if (!businessId || collectionName === 'users' || collectionName === 'businesses') {
      if (customId) {
        docRef = doc(dbFirestore, collectionName, customId);
        await this._withTimeout(setDoc(docRef, newItem));
      } else {
        docRef = await this._withTimeout(addDoc(collection(dbFirestore, collectionName), newItem));
      }
    } else {
      newItem.businessId = businessId; // Redundancy
      if (customId) {
        docRef = doc(dbFirestore, `businesses/${businessId}/${collectionName}`, customId);
        await this._withTimeout(setDoc(docRef, newItem));
      } else {
        docRef = await this._withTimeout(addDoc(collection(dbFirestore, `businesses/${businessId}/${collectionName}`), newItem));
      }
    }
    return { id: docRef.id, ...newItem };
  }

  // Update an existing item
  async update(collectionName, id, updates, businessId = null) {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    let docRef;
    if (!businessId || collectionName === 'users' || collectionName === 'businesses') {
      docRef = doc(dbFirestore, collectionName, id);
    } else {
      docRef = doc(dbFirestore, `businesses/${businessId}/${collectionName}`, id);
    }
    
    await this._withTimeout(updateDoc(docRef, updateData));
    return { id, ...updateData };
  }

  // Delete an item
  async delete(collectionName, id, businessId = null) {
    let docRef;
    if (!businessId || collectionName === 'users' || collectionName === 'businesses') {
      docRef = doc(dbFirestore, collectionName, id);
    } else {
      docRef = doc(dbFirestore, `businesses/${businessId}/${collectionName}`, id);
    }
    await this._withTimeout(deleteDoc(docRef));
    return true;
  }

  // --- Specialized Queries ---
  
  // Find user by Firebase Auth UID (optimized)
  async getUserByFirebaseUid(firebaseUid) {
    try {
      const docRef = doc(dbFirestore, 'users', firebaseUid);
      const d = await this._withTimeout(getDoc(docRef));
      return d.exists() ? { id: d.id, ...d.data() } : null;
    } catch (e) {
      // If permission denied or missing, they don't exist yet
      console.warn("User profile fetch:", e.message);
      return null;
    }
  }
}

export const db = new DatabaseService();
