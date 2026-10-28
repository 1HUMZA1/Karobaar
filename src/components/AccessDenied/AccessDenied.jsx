import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Building2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { ROLE_METADATA, ROLES } from '../../utils/permissions';

export const AccessDenied = ({ requiredRole, requiredPermission, moduleName = 'this module' }) => {
  const navigate = useNavigate();
  const { userRole, currentUser, currentBusiness } = useAppContext();
  const roleMeta = ROLE_METADATA[userRole] || ROLE_METADATA[ROLES.CASHIER];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '65vh',
      padding: '32px 16px',
      textAlign: 'center',
      animation: 'fadeIn 0.25s ease-out'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '20px',
        border: '2px solid var(--border-color)',
        backgroundColor: 'var(--bg-hover)',
        color: 'var(--text-main)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <ShieldAlert size={32} />
      </div>

      <h2 style={{
        fontSize: '1.6rem',
        fontWeight: 800,
        color: 'var(--text-main)',
        margin: '0 0 8px 0',
        letterSpacing: '-0.02em'
      }}>
        Access Restricted
      </h2>

      <p style={{
        fontSize: '0.95rem',
        color: 'var(--text-secondary)',
        maxWidth: '480px',
        margin: '0 0 24px 0',
        lineHeight: 1.5
      }}>
        Your current role (<strong>{userRole}</strong>) does not have authorization to access {moduleName} in <strong>{currentBusiness?.name || 'this workspace'}</strong>.
      </p>

      {/* Permissions Context Card */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '16px 20px',
        maxWidth: '440px',
        width: '100%',
        marginBottom: '28px',
        textAlign: 'left',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Current Entitlement
          </span>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: 'var(--text-main)',
            color: 'var(--bg-body)'
          }}>
            {userRole}
          </span>
        </div>

        {requiredPermission && (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: '6px' }}>
            Required Permission: <code style={{ padding: '2px 6px', borderRadius: '4px', background: 'var(--border-color)', fontWeight: 700 }}>{requiredPermission}</code>
          </div>
        )}

        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          To unlock this module, ask your business Owner or Manager to adjust your role in <strong>Settings → Team & Permissions</strong>.
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            backgroundColor: 'var(--text-main)',
            color: 'var(--bg-body)',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <LayoutDashboard size={16} />
          <span>Go to Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'transparent',
            color: 'var(--text-main)',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>
    </div>
  );
};
export default AccessDenied;
