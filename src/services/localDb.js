/**
 * Local Database Manager
 * Handles offline persistence and sync queueing using localStorage.
 */

const STORAGE_KEY = 'karobaar_local_db';
const QUEUE_KEY = 'karobaar_sync_queue';

class LocalDB {
  constructor() {
    this.db = this._loadDB();
    this.queue = this._loadQueue();
  }

  _loadDB() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("Failed to load LocalDB", e);
      return {};
    }
  }

  _saveDB() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    } catch (e) {
      console.error("Failed to save LocalDB", e);
    }
  }

  _loadQueue() {
    try {
      const data = localStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  _saveQueue() {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
      // Dispatch event to notify UI components (like Topbar sync indicator)
      window.dispatchEvent(new Event('karobaar_sync_update'));
    } catch (e) {
      console.error("Failed to save Queue", e);
    }
  }

  // --- Core Methods ---

  /**
   * Save a document to local storage and optionally queue it for sync
   */
  save(collectionName, id, data, queueForSync = true, businessId = null) {
    if (!this.db[collectionName]) {
      this.db[collectionName] = {};
    }

    const record = {
      ...data,
      id,
      _businessId: businessId, // internal reference
      _syncStatus: queueForSync ? 'pending' : 'synced',
      _localUpdatedAt: new Date().toISOString()
    };

    this.db[collectionName][id] = record;
    this._saveDB();

    if (queueForSync) {
      this._enqueue(collectionName, id, 'SET', record, businessId);
    }

    return record;
  }

  /**
   * Get a document from local storage
   */
  get(collectionName, id) {
    if (!this.db[collectionName]) return null;
    return this.db[collectionName][id] || null;
  }

  /**
   * Get all documents in a collection (optionally filtered by businessId)
   */
  getAll(collectionName, businessId = null) {
    if (!this.db[collectionName]) return [];
    let items = Object.values(this.db[collectionName]);
    if (businessId && collectionName !== 'users' && collectionName !== 'businesses') {
      items = items.filter(item => item.businessId === businessId || item._businessId === businessId);
    }
    return items;
  }

  /**
   * Remove a document locally and optionally queue the deletion
   */
  remove(collectionName, id, queueForSync = true, businessId = null) {
    if (this.db[collectionName] && this.db[collectionName][id]) {
      delete this.db[collectionName][id];
      this._saveDB();

      if (queueForSync) {
        this._enqueue(collectionName, id, 'DELETE', null, businessId);
      }
    }
  }

  /**
   * Bulk save records (e.g. when pulling from Firebase)
   */
  bulkSave(collectionName, records, businessId = null) {
    if (!this.db[collectionName]) {
      this.db[collectionName] = {};
    }
    
    records.forEach(record => {
      this.db[collectionName][record.id] = {
        ...record,
        _businessId: businessId,
        _syncStatus: 'synced',
        _localUpdatedAt: new Date().toISOString()
      };
    });
    this._saveDB();
  }

  // --- Queue Management ---

  _enqueue(collectionName, id, operation, data, businessId) {
    // Remove existing pending operation for this item if it exists
    this.queue = this.queue.filter(q => !(q.collectionName === collectionName && q.id === id));
    
    this.queue.push({
      queueId: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      collectionName,
      id,
      operation,
      data,
      businessId,
      status: 'pending',
      timestamp: new Date().toISOString(),
      retryCount: 0
    });
    this._saveQueue();
  }

  getPendingQueue() {
    return this.queue.filter(q => q.status === 'pending' || q.status === 'failed');
  }

  markQueueItemSuccess(queueId) {
    const idx = this.queue.findIndex(q => q.queueId === queueId);
    if (idx !== -1) {
      const item = this.queue[idx];
      // Mark local DB as synced
      if (item.operation !== 'DELETE' && this.db[item.collectionName] && this.db[item.collectionName][item.id]) {
        this.db[item.collectionName][item.id]._syncStatus = 'synced';
        this._saveDB();
      }
      // Remove from queue
      this.queue.splice(idx, 1);
      this._saveQueue();
    }
  }

  markQueueItemFailed(queueId, error) {
    const idx = this.queue.findIndex(q => q.queueId === queueId);
    if (idx !== -1) {
      this.queue[idx].status = 'failed';
      this.queue[idx].lastError = error;
      this.queue[idx].retryCount += 1;
      this._saveQueue();
    }
  }
}

export const localDb = new LocalDB();
