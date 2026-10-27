import React from 'react';
import { X, Check, Copy, QrCode } from 'lucide-react';
import qrcode from '../../utils/qrCodeGen';

export const UPIModal = ({ isOpen, onClose, onConfirm, total, currencySymbol = '₹', businessName = 'Karobaar' }) => {
  if (!isOpen) return null;

  const upiId = 'karobaar.pay@upi';
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${total.toFixed(2)}&cu=INR`;
  
  // Generate SVG QR Code
  let qrSvgString = '';
  try {
    const qr = qrcode(0, 'M');
    qr.addData(upiUrl);
    qr.make();
    qrSvgString = qr.createSvgTag(5, 3);
  } catch (err) {
    console.error('Failed to generate QR code:', err);
  }

  const copyUPI = () => {
    navigator.clipboard.writeText(upiUrl);
    alert('UPI Payment Link copied to clipboard!');
  };

  return (
    <div className="biz-modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="biz-modal-content" 
        style={{ maxWidth: '420px', width: '90%', padding: '24px', borderRadius: '14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', textAlign: 'center' }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <QrCode size={20} color="var(--text-main)" />
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>Instant UPI / QR Payment</h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
          Scan using any UPI App (GPay, PhonePe, Paytm, BHIM) to pay instantly.
        </p>

        {/* Amount Display */}
        <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', marginBottom: '18px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
            Amount Payable
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: 'var(--text-main)', marginTop: '2px' }}>
            {currencySymbol}{total.toFixed(2)}
          </div>
        </div>

        {/* QR Code Container */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', backgroundColor: '#ffffff', borderRadius: '12px', border: '2px solid var(--border-color)', width: 'fit-content', margin: '0 auto 16px auto', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          {qrSvgString ? (
            <div 
              dangerouslySetInnerHTML={{ __html: qrSvgString }} 
              style={{ width: '190px', height: '190px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
          ) : (
            <div style={{ width: '190px', height: '190px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
              QR Code unavailable
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
          <span>UPI ID: <strong>{upiId}</strong></span>
          <button 
            onClick={copyUPI}
            title="Copy UPI string"
            style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Copy size={11} /> Copy
          </button>
        </div>

        {/* Action Buttons strictly Monochrome */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{ flex: 1, height: '42px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={onConfirm}
            style={{ flex: 2, height: '42px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--text-main)', color: 'var(--bg-card)', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Check size={16} /> Confirm Payment Received
          </button>
        </div>
      </div>
    </div>
  );
};
