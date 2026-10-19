import React, { useState } from 'react';
import { MobileHeader } from '../../components/MobileHeader/MobileHeader';
import { Search, Plus, User, ChevronRight, Phone, Mail, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const MobileEmployees = ({ 
  employees, searchTerm, setSearchTerm, activeDept, setActiveDept,
  currencySymbol, loading, onAddEmployee, onEmployeeClick
}) => {
  const departments = ['All', ...new Set(employees.map(e => e.department).filter(Boolean))].slice(0, 5);
  
  const displayEmployees = employees.filter(e => 
    (activeDept === 'All' || e.department === activeDept) &&
    (e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (e.jobTitle || '').toLowerCase().includes(searchTerm.toLowerCase()))
  ).slice(0, 50);

  return (
    <div className="mobile-page pb-20">
      <MobileHeader 
        title="Employees" 
        rightIcon="plus" 
        rightOnClick={onAddEmployee}
      />
      
      <div className="px-4 py-2 sticky top-0 bg-[var(--bg-card)] z-30 shadow-sm border-b border-[var(--border-color)]">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <input 
              type="text" 
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--text-main)] outline-none focus:border-[var(--primary-color)]" 
              placeholder="Search employees..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {departments.map(dept => (
            <button 
              key={dept} 
              onClick={() => setActiveDept(dept)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeDept === dept ? 'bg-[var(--primary-color)] text-[var(--bg-primary)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-color)]'}`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 flex flex-col gap-3">
        {loading ? (
          <p className="text-center text-[var(--text-muted)] text-sm py-8">Loading employees...</p>
        ) : displayEmployees.length > 0 ? (
          displayEmployees.map(emp => (
            <div key={emp.id} className="flex items-center gap-3 p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl active:scale-[0.98] transition-transform" onClick={() => onEmployeeClick(emp)}>
              <div className="w-12 h-12 rounded-full bg-[var(--primary-color)] flex-shrink-0 flex items-center justify-center text-[var(--bg-primary)] font-bold text-lg">
                {emp.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[var(--text-main)] truncate mb-0.5">{emp.name}</h3>
                <p className="text-xs text-[var(--text-secondary)] truncate mb-1">{emp.jobTitle || emp.role || 'Staff'}</p>
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] truncate">
                  {emp.phone && <span className="flex items-center gap-0.5"><Phone size={10} /> {emp.phone}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${emp.status === 'Active' ? 'bg-[var(--success-color)]/10 text-[var(--success-color)]' : 'bg-[var(--danger)]/10 text-[var(--danger)]'}`}>
                  {emp.status}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-1"><Clock size={10}/> {emp.shift || 'Morning'}</span>
                <ChevronRight size={16} className="text-[var(--text-muted)] mt-1" />
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-[var(--text-muted)] text-sm py-8">No employees found</p>
        )}
      </div>
    </div>
  );
};
