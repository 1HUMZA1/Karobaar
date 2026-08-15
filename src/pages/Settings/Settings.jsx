import React, { useState } from 'react';
import { Save, Building, Users, BellRing, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import './Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-secondary">Configure your business preferences</p>
        </div>
        <Button icon={<Save size={18} />} onClick={handleSave}>Save Changes</Button>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          <button 
            className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Building size={18} /> Business Profile
          </button>
          <button 
            className={`settings-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} /> Users & Roles
          </button>
          <button 
            className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <BellRing size={18} /> Notifications
          </button>
          <button 
            className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={18} /> Security
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input label="Company Name" defaultValue="E Business Inc." />
                <Input label="Business Email" defaultValue="contact@ebusiness.com" type="email" />
                <Input label="Phone Number" defaultValue="+1 234 567 8900" />
                <Input label="Address" defaultValue="123 Commerce St, Business City" />
                <Input label="Tax ID / VAT" defaultValue="TAX-8923472" />
              </CardContent>
            </Card>
          )}

          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <CardTitle>Role Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-secondary mb-4">Configure access levels for employees.</p>
                <div className="role-list">
                  <div className="role-item">
                    <div>
                      <h4 className="font-medium">Administrator</h4>
                      <p className="text-xs text-secondary">Full access to all modules</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <div className="role-item">
                    <div>
                      <h4 className="font-medium">Manager</h4>
                      <p className="text-xs text-secondary">Can approve leave, view reports</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <div className="role-item">
                    <div>
                      <h4 className="font-medium">Cashier</h4>
                      <p className="text-xs text-secondary">POS and basic inventory access only</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {(activeTab === 'notifications' || activeTab === 'security') && (
            <Card>
              <CardContent className="p-8 text-center text-secondary">
                Configuration options for {activeTab} will appear here.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
