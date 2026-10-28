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

    const collectionsToSync = ['products', 'sales', 'customers', 'expenses', 'suppliers', 'invoices', 'employees', 'purchases', 'stock_movements', 'audit_logs', 'members', 'invitations'];
    
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
          name: 'SAS Cafeteria Owner',
          email: 'owner@sascafeteria.com',
          phone: '+91 98765 00000',
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
          email: 'rahul.manager@sascafeteria.com',
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
          email: 'priya.cashier@sascafeteria.com',
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

    const saved = await this.save('invitations', inviteId, invitation, businessId);
    
    // Also save globally indexed by code for instant lookup across branches
    localDb.save('invitation_codes', inviteCode, invitation, false);

    await this.logAudit('INVITATION_SENT', `Invited ${invitation.email || invitation.phone} as '${invitation.role}' (Code: ${inviteCode})`, userContext, businessId);
    return saved;
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
   * Find an invitation by its code or ID
   */
  async getInvitationByCode(code) {
    if (!code) return null;
    const cleanCode = code.trim().toUpperCase();

    // Check fast lookup index
    const indexed = localDb.get('invitation_codes', cleanCode);
    if (indexed) return indexed;

    // Search across all stored invitations
    const allInvitations = localDb.getAll('invitations');
    const matched = allInvitations.find(inv => (inv.code && inv.code.toUpperCase() === cleanCode) || inv.id === code);
    if (matched) return matched;

    // Check Cloud Firestore for invitation code match
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const q = query(collection(dbFirestore, 'invitations'), where('code', '==', cleanCode));
        const snap = await this._withTimeout(getDocs(q), 4000);
        if (snap && !snap.empty) {
          const docData = snap.docs[0].data();
          const found = { id: snap.docs[0].id, ...docData };
          localDb.save('invitation_codes', cleanCode, found, false);
          return found;
        }
      } catch (e) {}
    }

    return null;
  }

  /**
   * Accept an invitation and bind member to business
   */
  async acceptInvitation(code, user) {
    const invite = await this.getInvitationByCode(code);
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
    const targetUserId = user.uid || user.id;

    // 1. Create or update member in business
    const memberRecord = {
      id: targetUserId,
      userId: targetUserId,
      name: user.name || user.displayName || user.email?.split('@')[0] || 'Team Member',
      email: user.email || invite.email,
      phone: user.phoneNumber || user.phone || invite.phone || '',
      role: invite.role,
      permissions: invite.permissions || [],
      status: 'active',
      joinedAt: new Date().toISOString(),
      invitedBy: invite.invitedByName,
      businessId
    };
    await this.save('members', targetUserId, memberRecord, businessId);

    // 2. Mark invitation as accepted
    const updatedInvite = {
      ...invite,
      status: 'accepted',
      acceptedByUid: targetUserId,
      acceptedByName: memberRecord.name,
      acceptedAt: new Date().toISOString()
    };
    await this.save('invitations', invite.id, updatedInvite, businessId);
    localDb.save('invitation_codes', invite.code, updatedInvite, false);

    // 3. Update User's memberships
    try {
      const existingUser = await this.getById('users', targetUserId) || {};
      const currentMemberships = Array.isArray(existingUser.memberships) ? existingUser.memberships : [];
      if (!currentMemberships.includes(businessId)) {
        currentMemberships.push(businessId);
      }
      await this.save('users', targetUserId, {
        ...existingUser,
        id: targetUserId,
        email: user.email || existingUser.email,
        name: user.name || existingUser.name || memberRecord.name,
        memberships: currentMemberships,
        activeBusinessId: businessId
      });
    } catch (e) {
      console.warn("User membership update note:", e);
    }

    // 4. Log Audit Trail
    await this.logAudit('INVITATION_ACCEPTED', `User '${memberRecord.name}' accepted invite as '${invite.role}'`, user, businessId);

    return {
      success: true,
      businessId,
      role: invite.role,
      businessName: invite.businessName
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
        name: 'SAS CAFETERIA',
        currency: 'INR',
        userRoleInBusiness: 'Owner'
      };
      return [demoBiz];
    }

    return matched;
  }
}

export const db = new DatabaseService();
