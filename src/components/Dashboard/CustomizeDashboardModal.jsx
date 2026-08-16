import React, { useState } from 'react';
import { X, GripVertical, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';

// Mock implementation of a simple widget toggle modal
export const CustomizeDashboardModal = ({ isOpen, onClose, layout, onSave }) => {
  const [currentLayout, setCurrentLayout] = useState(layout || {
    showKPIs: true,
    showAnalytics: true,
    showTransactions: true,
    showInventory: true,
    showCustomers: true,
    showAttendance: true,
    showExpenses: true
  });

  if (!isOpen) return null;

  const toggleWidget = (key) => {
    setCurrentLayout({ ...currentLayout, [key]: !currentLayout[key] });
  };

  const saveSettings = () => {
    onSave(currentLayout);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in px-4">
      <div className="bg-[var(--bg-card)] rounded-xl w-full max-w-md shadow-2xl border border-border-color overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-border-color">
          <h2 className="text-xl font-bold text-text-main">Customize Dashboard</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-main transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-text-secondary mb-4">Toggle visibility of your dashboard command center widgets. Layouts will be saved automatically.</p>
          
          <div className="space-y-2">
            {[
              { id: 'showKPIs', label: 'Top Metrics & KPI Bar' },
              { id: 'showAnalytics', label: 'Revenue & Profit Analytics' },
              { id: 'showTransactions', label: 'Recent Transaction Feed' },
              { id: 'showInventory', label: 'Inventory & Low Stock Alerts' },
              { id: 'showCustomers', label: 'Customer Insights' },
              { id: 'showAttendance', label: 'Team Attendance & HR' },
              { id: 'showExpenses', label: 'Expense Overview' }
            ].map(widget => (
              <div key={widget.id} className="flex items-center justify-between p-3 rounded-lg border border-border-color bg-[var(--bg-body)]">
                <div className="flex items-center gap-3 text-text-main">
                  <GripVertical size={16} className="text-text-muted cursor-grab active:cursor-grabbing opacity-50"/>
                  <span className="font-medium text-sm">{widget.label}</span>
                </div>
                <button 
                  onClick={() => toggleWidget(widget.id)}
                  className={`p-1.5 rounded-md transition-colors ${currentLayout[widget.id] ? 'bg-primary-bg text-primary' : 'bg-[var(--bg-hover)] text-text-muted'}`}
                >
                  {currentLayout[widget.id] ? <Eye size={18}/> : <EyeOff size={18}/>}
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-5 border-t border-border-color bg-[var(--bg-hover)] flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={saveSettings}><Check size={16} className="mr-2"/> Save Layout</Button>
        </div>
      </div>
    </div>
  );
};
