import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Check, 
  Copy, 
  Trash2, 
  Edit2, 
  X, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  Send,
  Lock,
  ArrowRight,
  Shield,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  Ban
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { db } from '../../services/databaseService';
import { 
  ROLES, 
  ROLE_METADATA, 
  ROLE_PERMISSIONS_MAP, 
  PERMISSION_GROUPS, 
  ALL_PERMISSIONS, 
  hasPermission, 
  PERMISSIONS 
} from '../../utils/permissions';

export const TeamManagement = () => {
  const { currentBusiness, currentUser, hasUserPermission } = useAppContext();
  const activeBizId = currentBusiness?.id || 'demo-business-1';
  const isOwner = currentUser?.role === 'Owner' || currentBusiness?.ownerId === currentUser?.id;
  const canManageTeam = isOwner || hasUserPermission(PERMISSIONS.TEAM_MANAGE);
  const canInvite = isOwner || hasUserPermission(PERMISSIONS.TEAM_INVITE);

  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('members'); // 'members' | 'invitations' | 'roles'
  const [banner, setBanner] = useState({ type: '', text: '' });

  // Modal States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Invite Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState(ROLES.CASHIER);
  const [inviteCustomPerms, setInviteCustomPerms] = useState([]);
  const [inviteNotes, setInviteNotes] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Edit Member Form
  const [editRole, setEditRole] = useState('');
  const [editCustomPerms, setEditCustomPerms] = useState([]);
  const [editStatus, setEditStatus] = useState('active');

  // Transfer Ownership Form
  const [transferTargetUid, setTransferTargetUid] = useState('');
  const [transferConfirmText, setTransferConfirmText] = useState('');
  const [transferError, setTransferError] = useState('');

  // Load Members and Invitations
  const loadData = async () => {
    setLoading(true);
    try {
      const [membersData, invitesData] = await Promise.all([
        db.getBusinessMembers(activeBizId),
        db.getBusinessInvitations(activeBizId)
      ]);
      setMembers(membersData || []);
      setInvitations(invitesData || []);
    } catch (e) {
      console.warn("Load team data note:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBizId]);

  const showToast = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner({ type: '', text: '' }), 4000);
  };

  // --- Handlers: Invitations ---
  const handleOpenInvite = () => {
    setInviteEmail('');
    setInvitePhone('');
    setInviteName('');
    setInviteRole(ROLES.CASHIER);
    setInviteCustomPerms(ROLE_PERMISSIONS_MAP[ROLES.CASHIER] || []);
    setInviteNotes('');
    setShowInviteModal(true);
  };

  const handleToggleInvitePerm = (permKey) => {
    setInviteCustomPerms(prev => 
      prev.includes(permKey) ? prev.filter(k => k !== permKey) : [...prev, permKey]
    );
  };

  const handleRoleChangeForInvite = (newRole) => {
    setInviteRole(newRole);
    if (newRole !== ROLES.CUSTOM) {
      setInviteCustomPerms(ROLE_PERMISSIONS_MAP[newRole] || []);
    }
  };

  const handleSubmitInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() && !invitePhone.trim()) {
      showToast('error', 'Please enter either an email address or a phone number.');
      return;
    }

    setIsSubmittingInvite(true);
    try {
      const permissionsToAssign = inviteRole === ROLES.CUSTOM 
        ? inviteCustomPerms 
        : (ROLE_PERMISSIONS_MAP[inviteRole] || []);

      const newInvite = await db.createInvitation(activeBizId, {
        businessName: currentBusiness?.name || 'Karobaar Business',
        email: inviteEmail.trim(),
        phone: invitePhone.trim(),
        name: inviteName.trim(),
        role: inviteRole,
        permissions: permissionsToAssign,
        notes: inviteNotes.trim()
      }, currentUser);

      setShowInviteModal(false);
      showToast('success', `Invitation created! Share invite code: ${newInvite.code}`);
      loadData();
    } catch (err) {
      showToast('error', err.message || 'Failed to create invitation.');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleCopyInviteCode = (code) => {
    const inviteUrl = `${window.location.origin}/#/setup?join=${code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(code);
    showToast('success', `Copied link for code ${code} to clipboard!`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleRevokeInvite = async (invitationId) => {
    if (!window.confirm("Are you sure you want to revoke this invitation? The recipient will no longer be able to join.")) return;
    try {
      await db.revokeInvitation(activeBizId, invitationId, currentUser);
      showToast('success', 'Invitation revoked.');
      loadData();
    } catch (e) {
      showToast('error', e.message || 'Failed to revoke invitation.');
    }
  };

  // --- Handlers: Members ---
  const handleOpenEditMember = (member) => {
    setSelectedMember(member);
    setEditRole(member.role || ROLES.CASHIER);
    setEditStatus(member.status || 'active');
    setEditCustomPerms(member.permissions || ROLE_PERMISSIONS_MAP[member.role] || []);
    setShowEditModal(true);
  };

  const handleSaveMemberEdit = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      const perms = editRole === ROLES.CUSTOM 
        ? editCustomPerms 
        : (ROLE_PERMISSIONS_MAP[editRole] || []);

      await db.updateBusinessMember(activeBizId, selectedMember.id, {
        role: editRole,
        status: editStatus,
        permissions: perms
      }, currentUser);

      setShowEditModal(false);
      showToast('success', `Updated ${selectedMember.name || 'member'} profile.`);
      loadData();
    } catch (e) {
      showToast('error', e.message || 'Failed to update member.');
    }
  };

  const handleToggleMemberStatus = async (member) => {
    const nextStatus = member.status === 'suspended' ? 'active' : 'suspended';
    const actionLabel = nextStatus === 'suspended' ? 'suspend' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${actionLabel} ${member.name || member.email}?`)) return;

    try {
      await db.updateBusinessMember(activeBizId, member.id, { status: nextStatus }, currentUser);
      showToast('success', `Member ${nextStatus === 'suspended' ? 'suspended' : 'reactivated'}.`);
      loadData();
    } catch (e) {
      showToast('error', e.message || 'Status update failed.');
    }
  };

  const handleRemoveMember = async (member) => {
    if (!window.confirm(`Permanently remove ${member.name || member.email} from this business? They will immediately lose all access.`)) return;

    try {
      await db.removeBusinessMember(activeBizId, member.id, currentUser);
      showToast('success', 'Team member removed.');
      loadData();
    } catch (e) {
      showToast('error', e.message || 'Failed to remove member.');
    }
  };

  // --- Handlers: Ownership Transfer ---
  const handleTransferOwnership = async (e) => {
    e.preventDefault();
    setTransferError('');

    const targetBizName = (currentBusiness?.name || '').trim().toLowerCase();
    const typed = transferConfirmText.trim().toLowerCase();

    if (typed !== 'transfer' && typed !== targetBizName) {
      setTransferError(`Please type either "${currentBusiness?.name || 'TRANSFER'}" or "TRANSFER" to confirm.`);
      return;
    }

    if (!transferTargetUid) {
      setTransferError('Please select a verified team member to receive primary ownership.');
      return;
    }

    try {
      await db.transferBusinessOwnership(activeBizId, currentUser.id, transferTargetUid, currentUser);
      setShowTransferModal(false);
      showToast('success', 'Business ownership transferred successfully.');
      window.location.reload();
    } catch (e) {
      setTransferError(e.message || 'Ownership transfer failed.');
    }
  };

  return (
    <div className="team-management-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Alert Banner */}
      {banner.text && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          backgroundColor: banner.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          border: `1px solid ${banner.type === 'error' ? '#ef4444' : '#10b981'}`,
          color: 'var(--text-main)',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {banner.type === 'error' ? <AlertTriangle size={18} color="#ef4444" /> : <CheckCircle2 size={18} color="#10b981" />}
          <span style={{ fontWeight: 600 }}>{banner.text}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'var(--text-main, #09090b)',
              color: 'var(--bg-body, #ffffff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={20} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Team & Role Permissions
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Enterprise multi-user architecture with role isolation. Turn work into growth together.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={loadData}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
            title="Refresh Members"
          >
            <RefreshCw size={15} />
            <span className="hidden-mobile">Refresh</span>
          </button>

          {canInvite && (
            <button
              type="button"
              onClick={handleOpenInvite}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                backgroundColor: 'var(--text-main, #09090b)',
                color: 'var(--bg-body, #ffffff)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 700,
                fontSize: '0.88rem'
              }}
            >
              <UserPlus size={16} />
              <span>Invite Team Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color, #e2e8f0)',
        gap: '8px'
      }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('members')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'members' ? '2.5px solid var(--text-main)' : '2.5px solid transparent',
            color: activeSubTab === 'members' ? 'var(--text-main)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>Active Members</span>
          <span style={{
            fontSize: '0.75rem',
            padding: '2px 8px',
            borderRadius: '9999px',
            backgroundColor: 'var(--border-color)',
            color: 'var(--text-main)'
          }}>
            {members.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('invitations')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'invitations' ? '2.5px solid var(--text-main)' : '2.5px solid transparent',
            color: activeSubTab === 'invitations' ? 'var(--text-main)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>Invitations</span>
          <span style={{
            fontSize: '0.75rem',
            padding: '2px 8px',
            borderRadius: '9999px',
            backgroundColor: 'var(--border-color)',
            color: 'var(--text-main)'
          }}>
            {invitations.filter(i => i.status === 'pending').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('roles')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'roles' ? '2.5px solid var(--text-main)' : '2.5px solid transparent',
            color: activeSubTab === 'roles' ? 'var(--text-main)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>Role Matrix</span>
        </button>
      </div>

      {/* --- TAB 1: ACTIVE MEMBERS --- */}
      {activeSubTab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {members.length === 0 ? (
            <div style={{
              background: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '16px',
              padding: '40px 20px',
              textAlign: 'center'
            }}>
              <Users size={36} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
              <h3 style={{ margin: '0 0 6px 0', fontWeight: 700, color: 'var(--text-main)' }}>No Team Members Yet</h3>
              <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Invite cashiers, managers, and accountants to collaborate securely in this workspace.
              </p>
              {canInvite && (
                <button
                  type="button"
                  onClick={handleOpenInvite}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--text-main)',
                    color: 'var(--bg-body)',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Invite First Member
                </button>
              )}
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{
                      borderBottom: '1px solid var(--border-color, #e2e8f0)',
                      backgroundColor: 'rgba(0,0,0,0.02)',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      <th style={{ padding: '14px 20px' }}>Team Member</th>
                      <th style={{ padding: '14px 16px' }}>Role</th>
                      <th style={{ padding: '14px 16px' }}>Status</th>
                      <th style={{ padding: '14px 16px' }}>Contact Verification</th>
                      <th style={{ padding: '14px 16px' }}>Joined Date</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => {
                      const isMemberOwner = member.role === 'Owner' || member.id === currentBusiness?.ownerId;
                      const isCurrentUser = member.id === currentUser?.id;
                      const roleMeta = ROLE_METADATA[member.role] || ROLE_METADATA[ROLES.CASHIER];

                      return (
                        <tr key={member.id} style={{
                          borderBottom: '1px solid var(--border-color, #e2e8f0)',
                          transition: 'background 0.15s ease'
                        }}>
                          {/* Member Identity */}
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                backgroundColor: isMemberOwner ? 'var(--text-main)' : 'var(--border-color)',
                                color: isMemberOwner ? 'var(--bg-body)' : 'var(--text-main)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.9rem'
                              }}>
                                {(member.name || member.email || 'U')[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>{member.name || 'Team Member'}</span>
                                  {isCurrentUser && (
                                    <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                      You
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                  {member.email || member.phone || 'No contact email'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td style={{ padding: '16px 16px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                letterSpacing: '0.02em',
                                padding: '3px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: isMemberOwner ? 'var(--text-main)' : 'transparent',
                                color: isMemberOwner ? 'var(--bg-body)' : 'var(--text-main)'
                              }}>
                                {member.role || 'Cashier'}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '16px 16px' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              backgroundColor: member.status === 'suspended' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                              color: member.status === 'suspended' ? '#ef4444' : '#10b981',
                              border: `1px solid ${member.status === 'suspended' ? '#ef4444' : '#10b981'}`
                            }}>
                              {member.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE'}
                            </span>
                          </td>

                          {/* Verified Indicators */}
                          <td style={{ padding: '16px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {member.isEmailVerified ? (
                                <span title="Verified Email" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                                  <CheckCircle2 size={14} /> Email
                                </span>
                              ) : (
                                <span title="Email unverified" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  Email (unverified)
                                </span>
                              )}
                              {member.isPhoneVerified && (
                                <span title="Verified Phone" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                                  <CheckCircle2 size={14} /> Phone
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Joined At */}
                          <td style={{ padding: '16px 16px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                            {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Active Member'}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            {canManageTeam && !isMemberOwner && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditMember(member)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    background: 'transparent',
                                    color: 'var(--text-main)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Edit role and permissions"
                                >
                                  <Edit2 size={13} />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleMemberStatus(member)}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    background: 'transparent',
                                    color: member.status === 'suspended' ? '#10b981' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: 600
                                  }}
                                  title={member.status === 'suspended' ? 'Reactivate access' : 'Suspend account'}
                                >
                                  {member.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(member)}
                                  style={{
                                    padding: '6px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    background: 'transparent',
                                    color: '#ef4444',
                                    cursor: 'pointer'
                                  }}
                                  title="Remove member"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}

                            {isMemberOwner && isOwner && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTransferTargetUid('');
                                  setTransferConfirmText('');
                                  setTransferError('');
                                  setShowTransferModal(true);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  background: 'transparent',
                                  color: 'var(--text-main)',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Transfer Ownership
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: PENDING & PAST INVITATIONS --- */}
      {activeSubTab === 'invitations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {invitations.length === 0 ? (
            <div style={{
              background: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '16px',
              padding: '40px 20px',
              textAlign: 'center'
            }}>
              <Send size={36} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
              <h3 style={{ margin: '0 0 6px 0', fontWeight: 700, color: 'var(--text-main)' }}>No Active Invitations</h3>
              <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                All invites have been claimed or expired. Click below to generate an invitation link.
              </p>
              {canInvite && (
                <button
                  type="button"
                  onClick={handleOpenInvite}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--text-main)',
                    color: 'var(--bg-body)',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Generate Invitation
                </button>
              )}
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{
                      borderBottom: '1px solid var(--border-color, #e2e8f0)',
                      backgroundColor: 'rgba(0,0,0,0.02)',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      <th style={{ padding: '14px 20px' }}>Invited Recipient</th>
                      <th style={{ padding: '14px 16px' }}>Role</th>
                      <th style={{ padding: '14px 16px' }}>Invite Code</th>
                      <th style={{ padding: '14px 16px' }}>Status</th>
                      <th style={{ padding: '14px 16px' }}>Expiration</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((inv) => {
                      const isPending = inv.status === 'pending';

                      return (
                        <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                              {inv.email || inv.phone || 'Open Invitation'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              Invited by {inv.invitedByName || 'Owner'}
                            </div>
                          </td>

                          <td style={{ padding: '16px 16px' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)'
                            }}>
                              {inv.role}
                            </span>
                          </td>

                          <td style={{ padding: '16px 16px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              <code style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--border-color)',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                letterSpacing: '0.05em'
                              }}>
                                {inv.code}
                              </code>
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyInviteCode(inv.code)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: copiedCode === inv.code ? '#10b981' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title="Copy invite link"
                                >
                                  {copiedCode === inv.code ? <Check size={15} /> : <Copy size={15} />}
                                </button>
                              )}
                            </div>
                          </td>

                          <td style={{ padding: '16px 16px' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              backgroundColor: inv.status === 'accepted' 
                                ? 'rgba(16, 185, 129, 0.1)' 
                                : inv.status === 'pending' 
                                ? 'rgba(59, 130, 246, 0.1)' 
                                : 'rgba(239, 68, 68, 0.1)',
                              color: inv.status === 'accepted' 
                                ? '#10b981' 
                                : inv.status === 'pending' 
                                ? 'var(--text-main)' 
                                : '#ef4444',
                              border: '1px solid var(--border-color)'
                            }}>
                              {inv.status.toUpperCase()}
                            </span>
                          </td>

                          <td style={{ padding: '16px 16px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                            {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : '7 days'}
                          </td>

                          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            {isPending && canManageTeam && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleCopyInviteCode(inv.code)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    background: 'transparent',
                                    color: 'var(--text-main)',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Copy Link
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRevokeInvite(inv.id)}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    background: 'transparent',
                                    color: '#ef4444',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Revoke
                                </button>
                              </div>
                            )}
                            {inv.status === 'accepted' && (
                              <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                                Claimed by {inv.acceptedByName || 'member'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: ROLE PERMISSIONS MATRIX --- */}
      {activeSubTab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Standard Pre-Defined Role Matrix
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {Object.entries(ROLE_METADATA).map(([roleKey, meta]) => {
                const perms = ROLE_PERMISSIONS_MAP[roleKey] || [];
                return (
                  <div key={roleKey} style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                        {meta.label}
                      </h4>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)'
                      }}>
                        {meta.tag}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {meta.description}
                    </p>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Default Entitlements ({perms.length === ALL_PERMISSIONS.length ? '100% Full' : `${perms.length} Permissions`})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {perms.slice(0, 6).map(p => (
                          <span key={p} style={{
                            fontSize: '0.68rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--border-color)',
                            color: 'var(--text-main)'
                          }}>
                            {p.split('.')[1]}
                          </span>
                        ))}
                        {perms.length > 6 && (
                          <span style={{ fontSize: '0.68rem', padding: '2px 6px', color: 'var(--text-secondary)' }}>
                            +{perms.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: INVITE TEAM MEMBER */}
      {/* ============================================================== */}
      {showInviteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="var(--text-main)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Invite Team Member
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Recipient Details */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="employee@business.com"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={invitePhone}
                  onChange={e => setInvitePhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Assign Role */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                  Assign Role
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {[ROLES.MANAGER, ROLES.CASHIER, ROLES.INVENTORY, ROLES.ACCOUNTANT, ROLES.CUSTOM].map((role) => (
                    <div
                      key={role}
                      onClick={() => handleRoleChangeForInvite(role)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: `1.5px solid ${inviteRole === role ? 'var(--text-main)' : 'var(--border-color)'}`,
                        backgroundColor: inviteRole === role ? 'rgba(0,0,0,0.04)' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {role}
                      </span>
                      {inviteRole === role && <Check size={14} color="var(--text-main)" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Granular Permissions (if Custom Role selected) */}
              {inviteRole === ROLES.CUSTOM && (
                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '14px',
                  maxHeight: '220px',
                  overflowY: 'auto'
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
                    Configure Granular Permissions
                  </div>
                  {PERMISSION_GROUPS.map(group => (
                    <div key={group.groupId} style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        {group.groupName}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {group.permissions.map(perm => (
                          <label key={perm.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                            <input
                              type="checkbox"
                              checked={inviteCustomPerms.includes(perm.key)}
                              onChange={() => handleToggleInvitePerm(perm.key)}
                            />
                            <span>{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvite}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--text-main)',
                    color: 'var(--bg-body)',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {isSubmittingInvite ? 'Creating Invite...' : 'Generate & Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDIT MEMBER ROLE & PERMISSIONS */}
      {/* ============================================================== */}
      {showEditModal && selectedMember && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={20} color="var(--text-main)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Edit Member Permissions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--border-color)', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{selectedMember.name || 'Member'}</div>
              <div style={{ color: 'var(--text-secondary)' }}>{selectedMember.email || selectedMember.phone}</div>
            </div>

            <form onSubmit={handleSaveMemberEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                  Assigned Role
                </label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value={ROLES.MANAGER}>{ROLES.MANAGER}</option>
                  <option value={ROLES.CASHIER}>{ROLES.CASHIER}</option>
                  <option value={ROLES.INVENTORY}>{ROLES.INVENTORY}</option>
                  <option value={ROLES.ACCOUNTANT}>{ROLES.ACCOUNTANT}</option>
                  <option value={ROLES.CUSTOM}>{ROLES.CUSTOM}</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                  Account Status
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="active">Active (Full access permitted by role)</option>
                  <option value="suspended">Suspended (Access blocked immediately)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--text-main)',
                    color: 'var(--bg-body)',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: TRANSFER BUSINESS OWNERSHIP */}
      {/* ============================================================== */}
      {showTransferModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                <ShieldCheck size={22} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Transfer Business Ownership
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Transferring ownership will make the selected team member the primary owner with full unrestricted access to delete the business, manage subscription, and remove members. Your account will be demoted to <strong>Manager</strong>.
            </p>

            {transferError && (
              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.84rem', marginBottom: '14px', fontWeight: 600 }}>
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransferOwnership} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Select New Primary Owner
                </label>
                <select
                  value={transferTargetUid}
                  onChange={e => setTransferTargetUid(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                  required
                >
                  <option value="">-- Choose verified member --</option>
                  {members.filter(m => m.id !== currentUser?.id && m.status === 'active').map(m => (
                    <option key={m.id} value={m.id}>{m.name || m.email} ({m.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Type "TRANSFER" to confirm
                </label>
                <input
                  type="text"
                  value={transferConfirmText}
                  onChange={e => setTransferConfirmText(e.target.value)}
                  placeholder="TRANSFER"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Confirm Ownership Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default TeamManagement;
