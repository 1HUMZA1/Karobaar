import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Check, 
  Copy, 
  QrCode, 
  Upload, 
  Image as ImageIcon, 
  Settings as SettingsIcon, 
  RefreshCw, 
  Trash2, 
  ArrowLeft,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import qrcode from '../../utils/qrCodeGen';
import { db } from '../../services/databaseService';
import { useAppContext } from '../../context/AppContext';

export const UPIModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  total = 0, 
  currencySymbol = '₹', 
  businessName = 'Karobaar',
  businessId = null
}) => {
  const { currentBusiness, refreshUserProfile } = useAppContext();
  const fileInputRef = useRef(null);

  // Custom UPI ID state
  const [upiId, setUpiId] = useState(() => {
    return currentBusiness?.settings?.upiId || 
           localStorage.getItem('karobaar_custom_upi_id') || 
           'karobaar.pay@upi';
  });

  // Custom QR Code Image (e.g. Google Pay / PhonePe standee image)
  const [customQrImage, setCustomQrImage] = useState(() => {
    return currentBusiness?.settings?.upiQrImage || 
           localStorage.getItem('karobaar_custom_upi_qr_img') || 
           null;
  });

  // Display Mode: 'dynamic' (auto-generated SVG with exact ₹ amount) vs 'custom_image' (uploaded GPay QR)
  const [displayMode, setDisplayMode] = useState(() => {
    const savedMode = currentBusiness?.settings?.upiDefaultMode || localStorage.getItem('karobaar_custom_upi_mode');
    const hasImg = currentBusiness?.settings?.upiQrImage || localStorage.getItem('karobaar_custom_upi_qr_img');
    if (savedMode) return savedMode;
    return hasImg ? 'custom_image' : 'dynamic';
  });

  // Edit / Configuration Panel State
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [inputUpiId, setInputUpiId] = useState(upiId);
  const [tempQrImage, setTempQrImage] = useState(customQrImage);
  const [tempMode, setTempMode] = useState(displayMode);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync when business settings update
  useEffect(() => {
    if (currentBusiness?.settings?.upiId) {
      setUpiId(currentBusiness.settings.upiId);
      setInputUpiId(currentBusiness.settings.upiId);
    }
    if (currentBusiness?.settings?.upiQrImage) {
      setCustomQrImage(currentBusiness.settings.upiQrImage);
      setTempQrImage(currentBusiness.settings.upiQrImage);
    }
  }, [currentBusiness?.settings?.upiId, currentBusiness?.settings?.upiQrImage]);

  if (!isOpen) return null;

  // Active UPI Payment URI
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(businessName)}&am=${total.toFixed(2)}&cu=INR`;
  
  // Generate Dynamic SVG QR Code
  let qrSvgString = '';
  try {
    const qr = qrcode(0, 'M');
    qr.addData(upiUrl);
    qr.make();
    qrSvgString = qr.createSvgTag(5, 3);
  } catch (err) {
    console.error('Failed to generate dynamic QR code:', err);
  }

  const copyUPI = () => {
    navigator.clipboard.writeText(upiUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle QR Image File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert('Image size should be under 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      setTempQrImage(base64Data);
      setTempMode('custom_image');
    };
    reader.readAsDataURL(file);
  };

  // Remove Uploaded Image
  const handleRemoveImage = () => {
    setTempQrImage(null);
    setTempMode('dynamic');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save Custom UPI & QR Configuration
  const handleSaveConfig = async () => {
    const cleanId = inputUpiId.trim() || 'karobaar.pay@upi';
    setUpiId(cleanId);
    setCustomQrImage(tempQrImage);
    setDisplayMode(tempMode);

    // Save locally
    localStorage.setItem('karobaar_custom_upi_id', cleanId);
    if (tempQrImage) {
      localStorage.setItem('karobaar_custom_upi_qr_img', tempQrImage);
    } else {
      localStorage.removeItem('karobaar_custom_upi_qr_img');
    }
    localStorage.setItem('karobaar_custom_upi_mode', tempMode);

    // Persist to Business in DB if active
    const bId = businessId || currentBusiness?.id;
    if (bId) {
      try {
        await db.update('businesses', bId, {
          settings: {
            ...currentBusiness?.settings,
            upiId: cleanId,
            upiQrImage: tempQrImage,
            upiDefaultMode: tempMode
          }
        });
        if (refreshUserProfile) refreshUserProfile();
      } catch (err) {
        console.error('Failed to save UPI settings to business:', err);
      }
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsConfiguring(false);
    }, 900);
  };

  return (
    <div className="biz-modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="biz-modal-content" 
        style={{ 
          maxWidth: '440px', 
          width: '92%', 
          padding: '24px', 
          borderRadius: '16px', 
          backgroundColor: 'var(--bg-card)', 
          border: '1.5px solid var(--border-color)', 
          color: 'var(--text-main)', 
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
          overflow: 'hidden'
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <QrCode size={20} color="var(--text-main)" />
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
              {isConfiguring ? 'Customize UPI & QR Code' : 'Instant UPI / QR Payment'}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {!isConfiguring && (
              <button 
                type="button"
                onClick={() => {
                  setInputUpiId(upiId);
                  setTempQrImage(customQrImage);
                  setTempMode(displayMode);
                  setIsConfiguring(true);
                }}
                title="Configure custom UPI ID or upload Google Pay QR"
                style={{ 
                  background: 'transparent', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '6px', 
                  padding: '5px 8px', 
                  fontSize: '11px', 
                  fontWeight: '700', 
                  color: 'var(--text-main)', 
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <SettingsIcon size={12} />
                <span>Upload QR / ID</span>
              </button>
            )}

            <button 
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* VIEW 1: Standard Payment View */}
        {!isConfiguring ? (
          <>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: '1.4' }}>
              Scan using Google Pay, PhonePe, Paytm, BHIM, or any banking UPI app.
            </p>

            {/* Amount Payable Highlight */}
            <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-color)', marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                Amount Payable
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: 'var(--text-main)', marginTop: '2px' }}>
                {currencySymbol}{total.toFixed(2)}
              </div>
            </div>

            {/* QR View Mode Selector Tabs (If a custom image is uploaded) */}
            {customQrImage && (
              <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-body)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '12px' }}>
                <button 
                  type="button"
                  onClick={() => setDisplayMode('dynamic')}
                  style={{
                    flex: 1,
                    height: '28px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: displayMode === 'dynamic' ? 'var(--text-main)' : 'transparent',
                    color: displayMode === 'dynamic' ? 'var(--bg-card)' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  ⚡ Dynamic Bill QR (₹{total.toFixed(0)})
                </button>
                <button 
                  type="button"
                  onClick={() => setDisplayMode('custom_image')}
                  style={{
                    flex: 1,
                    height: '28px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: displayMode === 'custom_image' ? 'var(--text-main)' : 'transparent',
                    color: displayMode === 'custom_image' ? 'var(--bg-card)' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  🖼️ My Google Pay / Shop QR
                </button>
              </div>
            )}

            {/* QR Code Container */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '16px', 
              backgroundColor: '#ffffff', 
              borderRadius: '12px', 
              border: '2px solid var(--border-color)', 
              width: 'fit-content', 
              margin: '0 auto 14px auto', 
              boxShadow: '0 4px 14px rgba(0,0,0,0.08)' 
            }}>
              {displayMode === 'custom_image' && customQrImage ? (
                <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img 
                    src={customQrImage} 
                    alt="Custom Google Pay QR Code" 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '6px' }}
                  />
                </div>
              ) : qrSvgString ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: qrSvgString }} 
                  style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
              ) : (
                <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '12px' }}>
                  QR Code Unavailable
                </div>
              )}
            </div>

            {/* UPI ID Info & Copy Link */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              <span>UPI ID: <strong style={{ color: 'var(--text-main)' }}>{upiId}</strong></span>
              <button 
                onClick={copyUPI}
                title="Copy UPI link"
                style={{ 
                  background: 'transparent', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '4px', 
                  padding: '2px 8px', 
                  fontSize: '11px', 
                  cursor: 'pointer', 
                  color: 'var(--text-main)', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  fontWeight: '600'
                }}
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {/* Action Buttons (Strictly Monochrome) */}
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
          </>
        ) : (
          /* VIEW 2: Configuration / Customization View */
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              Enter your shop's Google Pay / UPI ID and upload your standee QR code image.
            </p>

            {/* Custom UPI ID Input */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Your Shop / Google Pay UPI ID
              </label>
              <input 
                type="text"
                value={inputUpiId}
                onChange={e => setInputUpiId(e.target.value)}
                placeholder="e.g. yourname@okaxis, 9876543210@paytm, store@ybl"
                style={{ 
                  width: '100%', 
                  height: '38px', 
                  backgroundColor: 'var(--bg-body)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px', 
                  padding: '0 10px', 
                  fontSize: '13px', 
                  color: 'var(--text-main)', 
                  outline: 'none',
                  fontWeight: '600'
                }}
              />
              {/* Quick Handle Chips */}
              <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                {['@okaxis', '@ybl', '@paytm', '@upi', '@ibl'].map(handle => (
                  <button 
                    key={handle}
                    type="button"
                    onClick={() => {
                      const prefix = inputUpiId.includes('@') ? inputUpiId.split('@')[0] : inputUpiId;
                      setInputUpiId((prefix || 'mybusiness') + handle);
                    }}
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-body)',
                      color: 'var(--text-secondary)',
                      fontSize: '10px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {handle}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Custom QR Code Image (Google Pay Standee) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Upload Custom QR Code (Google Pay / Standee Image)
              </label>

              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              {tempQrImage ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '10px', 
                  borderRadius: '8px', 
                  backgroundColor: 'var(--bg-body)', 
                  border: '1px solid var(--border-color)' 
                }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={tempQrImage} alt="QR Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)' }}>Custom QR Image Loaded</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Ready for customer scanning</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Replace
                    </button>
                    <button 
                      type="button"
                      onClick={handleRemoveImage}
                      style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--danger)', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '1.5px dashed var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: 'var(--bg-body)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Upload size={22} color="var(--text-muted)" style={{ margin: '0 auto 6px auto' }} />
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                    Click to upload Google Pay QR Image
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    PNG, JPG, or WEBP (Standee or Screenshot)
                  </div>
                </div>
              )}
            </div>

            {/* Default Display Mode Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Default Display Mode
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button"
                  onClick={() => setTempMode('dynamic')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: tempMode === 'dynamic' ? '1.5px solid var(--text-main)' : '1px solid var(--border-color)',
                    backgroundColor: tempMode === 'dynamic' ? 'var(--text-main)' : 'var(--bg-body)',
                    color: tempMode === 'dynamic' ? 'var(--bg-card)' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Dynamic Bill QR (with ₹ Amount)
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (!tempQrImage) {
                      alert('Please upload an image first.');
                      return;
                    }
                    setTempMode('custom_image');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: tempMode === 'custom_image' ? '1.5px solid var(--text-main)' : '1px solid var(--border-color)',
                    backgroundColor: tempMode === 'custom_image' ? 'var(--text-main)' : 'var(--bg-body)',
                    color: tempMode === 'custom_image' ? 'var(--bg-card)' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    opacity: tempQrImage ? 1 : 0.5
                  }}
                >
                  🖼️ Uploaded Shop QR Image
                </button>
              </div>
            </div>

            {saveSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', backgroundColor: 'var(--text-main)', color: 'var(--bg-card)', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                <CheckCircle2 size={15} />
                <span>Custom UPI & QR Settings Saved!</span>
              </div>
            )}

            {/* Save / Cancel buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button 
                type="button" 
                onClick={() => setIsConfiguring(false)}
                style={{ flex: 1, height: '40px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button 
                type="button" 
                onClick={handleSaveConfig}
                style={{ flex: 2, height: '40px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--text-main)', color: 'var(--bg-card)', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Check size={16} /> Save & Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
