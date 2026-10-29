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
      if (typeof localStorage === 'undefined') return {};
      const data = localStorage.getItem(STORAGE_KEY);
      const parsed = data ? JSON.parse(data) : {};
      
      // Ensure baseline demo records exist locally
      if (!parsed.businesses) parsed.businesses = {};
      if (!parsed.businesses['demo-business-1']) {
        parsed.businesses['demo-business-1'] = {
          id: 'demo-business-1',
          name: 'My Store',
          currency: 'INR',
          category: 'Cafeteria & Restaurant',
          address: 'Shop #4, Commercial Complex',
          phone: '+91 98765 43210',
          settings: {
            currency: 'INR',
            dateFormat: 'DD/MM/YYYY',
            theme: 'light',
            taxRate: 5,
            lowStockThreshold: 5,
            invoicePrefix: 'INV-',
            paymentTerms: 'Immediate / Due on Receipt',
            invoiceFooter: 'Thank you for your business!',
            aiSettings: {
              assistantName: 'Jarvis',
              wakeWord: 'Hey Jarvis',
              backgroundWake: true,
              aiEnabled: true,
              showFloatingBubble: true,
              autoExecute: true,
              autoAlertLowStock: true,
              autoPrintReceipt: false,
              dailySummaryNotification: true,
              rapidBarcodeAdd: true,
              language: 'hinglish'
            }
          },
          modules: {
            pos: true,
            inventory: true,
            orders: true,
            customers: true,
            expenses: true,
            suppliers: true,
            reports: true,
            employees: true,
            invoices: true
          }
        };
      }

      if (!parsed.users) parsed.users = {};
      if (!parsed.users['demo-user-1']) {
        parsed.users['demo-user-1'] = {
          id: 'demo-user-1',
          name: 'Store Owner',
          email: 'owner@karobaar.app',
          role: 'Owner',
          activeBusinessId: 'demo-business-1',
          memberships: ['demo-business-1'],
          onboardingCompleted: true
        };
      }

      return parsed;
    } catch (e) {
      console.error("Failed to load LocalDB", e);
      return {};
    }
  }

  _saveDB() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    } catch (e) {
      console.error("Failed to save LocalDB", e);
    }
  }

  _loadQueue() {
    try {
      if (typeof localStorage === 'undefined') return [];
      const data = localStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  _saveQueue() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
      // Dispatch event to notify UI components (like Topbar sync indicator)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('karobaar_sync_update'));
      }
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

    let actualId = id;
    let actualData = data;
    let actualBizId = businessId;

    // Support flexible signature: save(collectionName, dataObj, businessId)
    if (typeof id === 'object' && id !== null) {
      actualData = id;
      actualId = actualData.id || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      actualBizId = typeof data === 'string' ? data : (actualData.businessId || actualData._businessId || null);
    }

    const record = {
      ...actualData,
      id: actualId,
      businessId: actualBizId || actualData?.businessId || actualData?._businessId,
      _businessId: actualBizId || actualData?.businessId || actualData?._businessId,
      _syncStatus: queueForSync ? 'pending' : 'synced',
      _localUpdatedAt: new Date().toISOString()
    };

    this.db[collectionName][actualId] = record;
    this._saveDB();

    if (queueForSync && typeof id === 'string') {
      this._enqueue(collectionName, actualId, 'SET', record, actualBizId);
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
