import React, { useState } from 'react';
import { Building2, Plus, ArrowRight, X } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppContext } from '../../context/AppContext';
import { db } from '../../services/databaseService';
import { auth } from '../../services/firebase';

const Branches = () => {
  const { currentUser, currentBusiness, userBusinesses, refreshUserProfile } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [creating, setCreating] = useState(false);

  // Group businesses by parent. Find the ultimate parent (the first business in their memberships that isn't a branch)
  const branches = userBusinesses.filter(b => b.parentBusinessId === currentBusiness.id || b.id === currentBusiness.id || b.parentBusinessId === currentBusiness.parentBusinessId);

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!branchName.trim()) return;
    
    setCreating(true);
    try {
      const parentId = currentBusiness.parentBusinessId || currentBusiness.id;
      
      const newBranch = {
        name: branchName,
        type: currentBusiness.type,
        parentBusinessId: parentId,
        isBranch: true,
        ownerId: currentUser.firebaseUid,
        settings: {
          currency: currentBusiness.settings?.currency || 'USD',
          theme: currentBusiness.settings?.theme || 'light',
          appUiVersion: currentBusiness.settings?.appUiVersion || 'premium'
        },
        createdAt: new Date().toISOString()
      };

      const addedBranch = await db.add('businesses', newBranch);

      // Add to user's memberships
      const updatedMemberships = [...(currentUser.memberships || []), addedBranch.id];
      await db.update('users', currentUser.id, {
        memberships: updatedMemberships
      });

      alert(`Branch "${branchName}" created successfully! It is fully isolated with its own inventory and sales data.`);
      
      setIsModalOpen(false);
      setBranchName('');
      
      // Refresh context so dropdown appears
      await refreshUserProfile();
      
    } catch (err) {
      console.error(err);
      alert('Failed to create branch');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page-container" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Multi-Branch System
          </h1>
          <p className="text-secondary">Manage and expand your business locations</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>Create New Branch</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userBusinesses.map(biz => (
          <Card key={biz.id} className={biz.id === currentBusiness.id ? 'border-primary' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{biz.name}</h3>
                  <p className="text-xs text-secondary">{biz.isBranch ? 'Branch' : 'Headquarters'}</p>
                </div>
              </div>
              <p className="text-sm text-secondary mb-6">
                Fully isolated workspace with dedicated inventory, products, sales, and employee access.
              </p>
              {biz.id !== currentBusiness.id ? (
                <Button variant="outline" className="w-full" onClick={() => {
                  window.location.hash = '#/dashboard';
                  localStorage.setItem('karobaar-active-business', biz.id);
                  window.location.reload();
                }}>
                  Switch to Branch <ArrowRight size={16} className="ml-2" />
                </Button>
              ) : (
                <div className="text-center py-2 text-sm font-bold text-success bg-[var(--success-light)] rounded-lg">
                  Currently Active
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up">
            <div className="modal-header">
              <h2>Create New Branch</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateBranch} className="modal-form">
              <div className="form-group">
                <label>Branch Name *</label>
                <Input 
                  required 
                  value={branchName} 
                  onChange={e => setBranchName(e.target.value)}
                  placeholder="e.g. Secunderabad Branch"
                />
              </div>
              <p className="text-sm font-medium text-warning bg-[var(--warning-light)] p-3 rounded-lg mb-4">
                Note: The new branch will have a completely empty database. You will need to add its initial stock, products, and employees separately.
              </p>
              <div className="modal-actions">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Deploying Branch...' : 'Create Branch Workspace'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;
