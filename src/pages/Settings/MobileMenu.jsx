import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileHeader } from '../../components/MobileHeader/MobileHeader';
import { Users, UserCheck, Receipt, Truck, Box, Package, Tags, Briefcase, RefreshCw, Bell, Settings, Database, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';

export const MobileMenu = () => {
  const { currentUser, currentBusiness } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const managementItems = [
    { icon: <Users size={24} className="text-[#3b82f6]" />, label: 'Employees', path: '/employees' },
    { icon: <UserCheck size={24} className="text-[#0ea5e9]" />, label: 'Attendance', path: '/attendance' },
    { icon: <Receipt size={24} className="text-[#ef4444]" />, label: 'Expenses', path: '/expenses' },
    { icon: <Truck size={24} className="text-[#8b5cf6]" />, label: 'Suppliers', path: '/suppliers' },
    { icon: <Users size={24} className="text-[#10b981]" />, label: 'Customers', path: '/customers' },
    { icon: <Box size={24} className="text-[#f59e0b]" />, label: 'Products', path: '/products' },
    { icon: <Tags size={24} className="text-[#6366f1]" />, label: 'Categories', path: '/products' },
    { icon: <Briefcase size={24} className="text-[#14b8a6]" />, label: 'Brands', path: '/products' },
    { icon: <RefreshCw size={24} className="text-[#f43f5e]" />, label: 'Stock In/Out', path: '/inventory' }
  ];

  const otherItems = [
    { icon: <Bell size={18} className="text-[#64748b]" />, label: 'Notifications', path: '/notifications', badge: '3' },
    { icon: <Settings size={18} className="text-[#64748b]" />, label: 'Settings', path: '/settings' },
    { icon: <Database size={18} className="text-[#64748b]" />, label: 'Backup & Restore', path: '/settings' },
    { icon: <HelpCircle size={18} className="text-[#64748b]" />, label: 'Help & Support', path: '/settings' }
  ];

  return (
    <div className="mobile-menu-page pb-20 bg-[#f8fafc] min-h-screen">
      <MobileHeader title="More" />
      
      <div className="px-4 py-4">
        {/* Profile Card */}
        <div className="bg-[var(--bg-card)] rounded-2xl p-4 flex items-center gap-4 mb-6 shadow-sm border border-[var(--border-color)]">
          <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
            <img src={currentUser?.photoURL || "https://ui-avatars.com/api/?name=&background=random"} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-[var(--text-main)]">{currentUser?.name || '1_HUMZA_1'}</h3>
            <p className="text-[10px] text-[var(--text-muted)]">{currentUser?.role || 'Business Owner'}</p>
          </div>
          <ChevronRight size={20} className="text-[var(--text-muted)]" />
        </div>

        {/* Business Management Grid */}
        <h4 className="text-[11px] font-bold text-[var(--text-main)] mb-3">Business Management</h4>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {managementItems.map((item, idx) => (
            <div key={idx} onClick={() => navigate(item.path)} className="bg-[var(--bg-card)] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm border border-[var(--border-color)] active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-full bg-[#f8fafc] flex items-center justify-center mb-1">
                {item.icon}
              </div>
              <span className="text-[9px] font-semibold text-center text-[var(--text-main)]">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Others List */}
        <h4 className="text-[11px] font-bold text-[var(--text-main)] mb-3">Others</h4>
        <div className="bg-[var(--bg-card)] rounded-2xl p-2 shadow-sm border border-[var(--border-color)] flex flex-col">
          {otherItems.map((item, idx) => (
            <div key={idx} onClick={() => navigate(item.path)} className="flex items-center gap-3 p-3 border-b border-[var(--border-color)] last:border-0 active:bg-[var(--bg-hover)] transition-colors rounded-xl">
              <div className="w-8 h-8 rounded-full bg-[#f8fafc] flex items-center justify-center">
                {item.icon}
              </div>
              <span className="flex-1 text-xs font-semibold text-[var(--text-main)]">{item.label}</span>
              {item.badge && <span className="w-5 h-5 rounded-full bg-[var(--danger)] text-[var(--bg-primary)] text-[10px] font-bold flex items-center justify-center">{item.badge}</span>}
              <ChevronRight size={16} className="text-[var(--text-muted)]" />
            </div>
          ))}
          
          <div onClick={handleLogout} className="flex items-center gap-3 p-3 active:bg-[var(--bg-hover)] transition-colors rounded-xl">
            <div className="w-8 h-8 rounded-full bg-[#f8fafc] flex items-center justify-center">
              <LogOut size={18} className="text-[var(--text-main)]" />
            </div>
            <span className="flex-1 text-xs font-semibold text-[var(--text-main)]">Log Out</span>
            <ChevronRight size={16} className="text-[var(--text-muted)]" />
          </div>
        </div>
      </div>
    </div>
  );
};
