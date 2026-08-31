import React, { useState } from 'react';
import { MobileHeader } from '../../components/MobileHeader/MobileHeader';
import { Line } from 'react-chartjs-2';
import { Calendar, ChevronRight } from 'lucide-react';
import { format, subDays } from 'date-fns';

export const MobileReports = ({ 
  currencySymbol, 
  totalRevenue, 
  revenueGrowth, 
  totalOrders, 
  averageOrderValue, 
  totalCustomers, 
  returnOrders, 
  topSellingProducts,
  salesByDayChart
}) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'Sales', 'Profit', 'Products', 'Customers'];

  const startDate = subDays(new Date(), 7);
  const endDate = new Date();

  return (
    <div className="mobile-reports-page pb-20 bg-[#f8fafc] min-h-screen">
      <MobileHeader title="Reports" rightIcon="calendar" />
      
      <div className="px-4 py-3 bg-[var(--bg-card)] mb-2">
        <div className="flex items-center gap-2 border border-[var(--border-color)] rounded-xl p-2 px-3 text-sm font-semibold text-[var(--text-main)]">
          <Calendar size={16} className="text-[var(--text-muted)]" />
          <span className="flex-1">{format(startDate, 'dd MMM')} - {format(endDate, 'dd MMM yyyy')}</span>
          <ChevronRight size={16} className="text-[var(--text-muted)] rotate-90" />
        </div>
      </div>

      <div className="px-4 py-2 flex gap-2 overflow-x-auto hide-scrollbar bg-[var(--bg-card)] shadow-sm sticky top-[60px] z-30 mb-4">
        {tabs.map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-[var(--primary-color)] text-[var(--bg-primary)]' : 'bg-transparent text-[var(--text-secondary)]'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="px-4 flex flex-col gap-4">
        <div className="bg-[var(--bg-card)] rounded-3xl p-5 shadow-sm border border-[var(--border-color)]">
          <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Total Sales</p>
          <h2 className="text-3xl font-black text-[var(--text-main)] mb-1">{currencySymbol}{totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
          <p className="text-[10px] font-bold text-[var(--success-color)] flex items-center gap-1 mb-4">
            <span className="text-[var(--success-color)]">? {revenueGrowth.toFixed(1)}%</span> vs last 7 days
          </p>
          
          <div className="h-32 mb-4 w-full">
            <Line 
              data={salesByDayChart} 
              options={{
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                  x: { display: true, grid: { display: false } },
                  y: { display: true, border: { display: false } }
                },
                elements: { line: { tension: 0.4, borderWidth: 2 }, point: { radius: 3 } }
              }} 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-sm border border-[var(--border-color)]">
            <p className="text-[10px] font-semibold text-[var(--text-muted)] mb-1">Total Orders</p>
            <h3 className="text-lg font-black text-[var(--text-main)] mb-1 flex justify-between items-center">
              {totalOrders} <ChevronRight size={14} className="text-[var(--text-muted)]" />
            </h3>
            <p className="text-[9px] font-bold text-[var(--success-color)]">? 0%</p>
          </div>
          <div className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-sm border border-[var(--border-color)]">
            <p className="text-[10px] font-semibold text-[var(--text-muted)] mb-1">Average Order</p>
            <h3 className="text-lg font-black text-[var(--text-main)] mb-1 flex justify-between items-center">
              {currencySymbol}{averageOrderValue.toLocaleString(undefined, {minimumFractionDigits: 2})} <ChevronRight size={14} className="text-[var(--text-muted)]" />
            </h3>
            <p className="text-[9px] font-bold text-[var(--success-color)]">? 0%</p>
          </div>
          <div className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-sm border border-[var(--border-color)]">
            <p className="text-[10px] font-semibold text-[var(--text-muted)] mb-1">Total Customers</p>
            <h3 className="text-lg font-black text-[var(--text-main)] mb-1 flex justify-between items-center">
              {totalCustomers} <ChevronRight size={14} className="text-[var(--text-muted)]" />
            </h3>
            <p className="text-[9px] font-bold text-[var(--success-color)]">? 0%</p>
          </div>
          <div className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-sm border border-[var(--border-color)]">
            <p className="text-[10px] font-semibold text-[var(--text-muted)] mb-1">Return Orders</p>
            <h3 className="text-lg font-black text-[var(--text-main)] mb-1 flex justify-between items-center">
              {returnOrders} <ChevronRight size={14} className="text-[var(--text-muted)]" />
            </h3>
            <p className="text-[9px] font-bold text-[var(--danger)]">0 0%</p>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-3xl p-5 shadow-sm border border-[var(--border-color)] mt-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-[var(--text-main)]">Top Selling Products</h3>
            <span className="text-[10px] font-bold text-[var(--primary-color)]">View All</span>
          </div>
          
          {topSellingProducts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {topSellingProducts.map((p, i) => (
                <div key={p.id} className="flex justify-between items-center pb-3 border-b border-[var(--border-color)] last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[var(--text-muted)]">#{i+1}</span>
                    <span className="text-sm font-semibold text-[var(--text-main)]">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[var(--text-main)] block">{currencySymbol}{p.revenueGenerated.toLocaleString()}</span>
                    <span className="text-[10px] font-semibold text-[var(--text-muted)]">{p.unitsSold} units</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center opacity-50">
              <div className="w-12 h-12 bg-[var(--bg-hover)] rounded-xl mb-2 flex items-center justify-center">
                <Calendar className="text-[var(--primary-color)]" />
              </div>
              <p className="text-xs font-bold text-[var(--text-muted)]">No data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
