import React from 'react';
import { 
  X, 
  Activity, 
  Sparkles, 
  Layers, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Wallet, 
  Users, 
  Package, 
  ExternalLink,
  Receipt,
  Clock,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100vw',
  height: '100vh',
  zIndex: 10000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.65)',
  backdropFilter: 'blur(4px)',
  padding: '16px',
  boxSizing: 'border-box'
};

const modalBoxStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '20px',
  width: '100%',
  maxHeight: '88vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
  overflow: 'hidden'
};

/**
 * 1. Business Health Audit Modal
 */
export const BusinessHealthModal = ({ 
  isOpen, 
  onClose, 
  healthScore = 70, 
  healthLabel = 'Good', 
  metrics = {}, 
  currencySymbol = '₹' 
}) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const grossMargin = parseFloat(metrics.grossMargin || 0);
  const lowStockCount = metrics.lowStockCount || 0;
  const pendingReceivables = metrics.receivables || 0;
  const revenue = metrics.revenue || 0;
  const expenses = metrics.expenses || 0;
  const netProfit = metrics.netProfit || 0;
  const revTrend = metrics.trends?.revTrend || { isPositive: true, value: '0' };

  const factors = [
    {
      title: 'Gross Margin Performance',
      score: grossMargin >= 35 ? 95 : grossMargin >= 25 ? 80 : grossMargin > 0 ? 55 : 30,
      status: grossMargin >= 30 ? 'Healthy' : grossMargin > 0 ? 'Acceptable' : 'Low Margin',
      detail: `${grossMargin.toFixed(1)}% gross margin across recorded sales. Target benchmark is ≥30%.`,
      isGood: grossMargin >= 30,
      action: () => { onClose(); navigate('/products'); },
      actionLabel: 'Review Product Pricing'
    },
    {
      title: 'Stock Health & Reliability',
      score: lowStockCount === 0 ? 100 : lowStockCount <= 2 ? 75 : 40,
      status: lowStockCount === 0 ? 'Optimal' : `${lowStockCount} Items Low`,
      detail: lowStockCount === 0 ? 'All product stock levels are above minimum thresholds.' : `${lowStockCount} product(s) have fallen to or below reorder threshold.`,
      isGood: lowStockCount === 0,
      action: () => { onClose(); navigate('/inventory'); },
      actionLabel: 'Restock Products'
    },
    {
      title: 'Udhaar (Khata) Exposure',
      score: pendingReceivables === 0 ? 100 : (revenue > 0 && pendingReceivables < revenue * 0.3) ? 80 : 50,
      status: pendingReceivables === 0 ? 'Clean' : `${currencySymbol}${pendingReceivables.toLocaleString()} Due`,
      detail: pendingReceivables === 0 ? 'Zero outstanding credit. All customer balances are settled.' : `Outstanding balance pending collection across customer Khata accounts.`,
      isGood: pendingReceivables === 0 || (revenue > 0 && pendingReceivables < revenue * 0.25),
      action: () => { onClose(); navigate('/payments'); },
      actionLabel: 'Collect Pending Udhaar'
    },
    {
      title: 'Sales Velocity & Growth',
      score: revTrend.isPositive ? 90 : 60,
      status: revTrend.isPositive ? `+${revTrend.value}% vs Prev` : `-${revTrend.value}% vs Prev`,
      detail: revTrend.isPositive ? 'Sales revenue is expanding compared to the previous period.' : 'Revenue dipped slightly vs the equivalent previous window.',
      isGood: revTrend.isPositive,
      action: () => { onClose(); navigate('/orders'); },
      actionLabel: 'Analyze Sales Flow'
    },
    {
      title: 'Expense Discipline',
      score: netProfit > 0 ? 85 : 45,
      status: netProfit >= 0 ? 'Profitable' : 'Negative Margin',
      detail: `Operating expenses are ${currencySymbol}${expenses.toLocaleString()} yielding net profit of ${currencySymbol}${netProfit.toLocaleString()}.`,
      isGood: netProfit >= 0,
      action: () => { onClose(); navigate('/expenses'); },
      actionLabel: 'Review Operating Costs'
    }
  ];

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalBoxStyle, maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--text-main)', color: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>Business Health Radar</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Live operational audit & growth improvement actions</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Main Score Banner */}
          <div style={{ padding: '16px 20px', borderRadius: '14px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Composite Score</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{healthScore}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>/100</span>
                <span style={{ marginLeft: '8px', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, background: 'var(--text-main)', color: 'var(--bg-card)' }}>
                  {healthLabel}
                </span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '240px', textAlign: 'right', lineHeight: 1.4 }}>
              Calculated dynamically from gross profit margin, inventory stock levels, Khata exposure, and sales growth.
            </p>
          </div>

          {/* 5 Factors Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Pillar Evaluation Breakdown</h4>
            {factors.map((f, i) => (
              <div key={i} style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {f.isGood ? <CheckCircle2 size={16} color="var(--text-main)" /> : <AlertCircle size={16} color="var(--text-secondary)" />}
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>{f.title}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                      {f.status}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{f.detail}</p>
                </div>
                <button 
                  onClick={f.action}
                  style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid var(--border-color)', background: 'var(--bg-hover)', color: 'var(--text-main)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {f.actionLabel} →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-hover)', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={onClose} 
            style={{ padding: '8px 20px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, background: 'var(--text-main)', color: 'var(--bg-card)', border: 'none', cursor: 'pointer' }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 2. Legacy Mode Confirmation Modal
 */
export const LegacyModeConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalBoxStyle, maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--text-main)', color: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>Switch to Legacy Operations Desk?</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <p style={{ margin: 0 }}>
            <strong>Legacy Operations Desk</strong> provides an ultra-compact, high-density register view optimized for:
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-main)', fontWeight: 600 }}>
            <li>Rapid cashier POS billing keystrokes</li>
            <li>Direct petty cash ledger entry tabs</li>
            <li>Quick employee attendance & leave tracking shortcuts</li>
          </ul>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            <strong>Premium Mode</strong> (your current view) features executive KPI radars, live analytics charts, and business health audits.
          </p>
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-hover)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button 
            onClick={onClose} 
            style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer' }}
          >
            Stay in Premium
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            style={{ padding: '8px 18px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, background: 'var(--text-main)', color: 'var(--bg-card)', border: 'none', cursor: 'pointer' }}
          >
            Switch to Legacy Desk ⚡
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 3. Payment Method Filtered Transactions Modal
 */
export const PaymentMethodModal = ({
  isOpen,
  onClose,
  methodName = 'Cash',
  sales = [],
  currencySymbol = '₹',
  dateRangeLabel = 'Today'
}) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const filteredSales = sales.filter(s => {
    const m = (s.paymentMethod || 'Cash').toLowerCase();
    const target = methodName.toLowerCase();
    if (target === 'upi') return m.includes('upi');
    if (target === 'card') return m.includes('card');
    if (target === 'udhaar') return m.includes('udhaar') || m.includes('credit') || (s.balanceDue > 0);
    return m.includes('cash') || (!m.includes('upi') && !m.includes('card') && !m.includes('udhaar') && !m.includes('credit'));
  });

  const methodTotal = filteredSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalBoxStyle, maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
              <Wallet size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>{methodName} Transactions</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{dateRangeLabel} • {filteredSales.length} transaction(s)</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', background: 'var(--bg-hover)', padding: '4px 12px', borderRadius: '9999px', border: '1px solid var(--border-color)' }}>
              Total: {currencySymbol}{methodTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ padding: '12px 20px', overflowY: 'auto', flex: 1 }}>
          {filteredSales.length > 0 ? (
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '10px 8px' }}>Invoice #</th>
                  <th style={{ padding: '10px 8px' }}>Customer</th>
                  <th style={{ padding: '10px 8px' }}>Date</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((s, idx) => (
                  <tr key={s.id || idx} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {s.invoiceNumber || (s.id ? `#${s.id.slice(0, 8).toUpperCase()}` : '#INV-001')}
                    </td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>
                      {s.customerName || 'Walk-in Customer'}
                    </td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>
                      {s.date ? format(new Date(s.date), 'MMM dd, HH:mm') : 'Today'}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 800, color: 'var(--text-main)' }}>
                      {currencySymbol}{(Number(s.total) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '9999px', background: 'var(--bg-hover)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                        {s.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Wallet size={28} style={{ opacity: 0.35, margin: '0 auto 8px auto' }} />
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>No {methodName} records in this period</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem' }}>Zero payments recorded via {methodName} for the selected date filter.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-hover)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '6px 18px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, background: 'var(--text-main)', color: 'var(--bg-card)', border: 'none', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 4. Customer Udhaar (Khata) Breakdown Modal
 */
export const UdhaarBreakdownModal = ({
  isOpen,
  onClose,
  customers = [],
  currencySymbol = '₹'
}) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const udhaarCustomers = customers.filter(c => (Number(c.outstandingBalance) || 0) > 0);
  const totalUdhaar = udhaarCustomers.reduce((sum, c) => sum + (Number(c.outstandingBalance) || 0), 0);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalBoxStyle, maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
              <Users size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>Pending Udhaar (Customer Khata)</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{udhaarCustomers.length} customer(s) with balance due</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', background: 'var(--bg-hover)', padding: '4px 12px', borderRadius: '9999px', border: '1px solid var(--border-color)' }}>
              Total: {currencySymbol}{totalUdhaar.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {udhaarCustomers.length > 0 ? (
            udhaarCustomers.map((c) => (
              <div key={c.id} style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>{c.name}</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{c.phone || 'No phone recorded'}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {currencySymbol}{(Number(c.outstandingBalance) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <button 
                    onClick={() => { onClose(); navigate('/payments'); }}
                    style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, background: 'var(--text-main)', color: 'var(--bg-card)', border: 'none', cursor: 'pointer' }}
                  >
                    Record Payment
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={32} color="var(--text-main)" style={{ margin: '0 auto 8px auto' }} />
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>Zero Outstanding Credit</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem' }}>All customer Khata accounts are currently fully settled.</p>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => { onClose(); navigate('/customers'); }}
            style={{ background: 'transparent', border: 'none', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer', padding: 0 }}
          >
            Manage Customer Directory →
          </button>
          <button onClick={onClose} style={{ padding: '6px 18px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, background: 'var(--text-main)', color: 'var(--bg-card)', border: 'none', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 5. Stock Health Audit Modal
 */
export const StockHealthModal = ({
  isOpen,
  onClose,
  products = [],
  currencySymbol = '₹'
}) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const lowStockItems = products.filter(p => (Number(p.stockQuantity) || 0) <= (Number(p.minimumStock) || 5));

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalBoxStyle, maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
              <Package size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>Inventory Stock Health</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{lowStockItems.length} product(s) below reorder threshold</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {lowStockItems.length > 0 ? (
            lowStockItems.map((p) => {
              const stock = Number(p.stockQuantity) || 0;
              const min = Number(p.minimumStock) || 5;
              const suggestedReorder = Math.max(5, (min * 2) - stock);

              return (
                <div key={p.id} style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>{p.name}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        {p.category || 'General'}
                      </span>
                    </div>
                    <p style={{ margin: '3px 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      Current: <strong style={{ color: 'var(--text-main)' }}>{stock}</strong> units • Threshold: {min}
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Suggested Restock: +{suggestedReorder} units
                    </p>
                  </div>
                  <button 
                    onClick={() => { onClose(); navigate('/products'); }}
                    style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, background: 'var(--text-main)', color: 'var(--bg-card)', border: 'none', cursor: 'pointer' }}
                  >
                    Restock
                  </button>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={32} color="var(--text-main)" style={{ margin: '0 auto 8px auto' }} />
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>All Products Well Stocked</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem' }}>Every inventory product is safely above minimum alert thresholds.</p>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => { onClose(); navigate('/inventory'); }}
            style={{ background: 'transparent', border: 'none', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer', padding: 0 }}
          >
            Audit Full Inventory Ledger →
          </button>
          <button onClick={onClose} style={{ padding: '6px 18px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, background: 'var(--text-main)', color: 'var(--bg-card)', border: 'none', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
