import React from 'react';
import {
  BrainCircuit,
  Sliders,
  Download,
  Trash2,
  HelpCircle,
  Layers,
} from 'lucide-react';
import type { Session, UserSettings } from '../types/roulette';

interface HeaderProps {
  session: Session | null;
  totalResults: number;
  settings: UserSettings;
  onOpenSettings: () => void;
  onOpenExportImport: () => void;
  onOpenClearConfirm: () => void;
  onOpenMappingModal: () => void;
  onOpenHelpModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  totalResults,
  onOpenSettings,
  onOpenExportImport,
  onOpenClearConfirm,
  onOpenMappingModal,
  onOpenHelpModal,
}) => {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(8, 12, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0.85rem 1.25rem',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {/* Brand & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #e11d48 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
          }}>
            <BrainCircuit size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                Adaptive Roulette Mathematics
              </h1>
              <span style={{
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                Statistical Engine v2.0
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Deterministic Probability, Custom Mapping, House Edge & Out-of-Sample Tracking
            </p>
          </div>
        </div>

        {/* Status Badges & Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Custom Mapping Notice Badge */}
          <button
            onClick={onOpenMappingModal}
            className="btn-secondary"
            title="View custom 1–36 color & parity mapping"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', borderColor: 'rgba(244, 63, 94, 0.4)' }}
          >
            <Layers size={14} color="#f43f5e" />
            <span style={{ color: '#fda4af', fontWeight: 600 }}>Custom 1–36 Mapping</span>
          </button>

          {/* Session Badge */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-md)',
            padding: '0.35rem 0.75rem',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}>
            <span style={{ color: 'var(--text-muted)' }}>Session:</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{session?.name || 'Active'}</span>
            <span style={{ color: 'var(--border-card)' }}>|</span>
            <span style={{ color: '#67e8f9', fontWeight: 700 }}>{totalResults}</span>
            <span style={{ color: 'var(--text-muted)' }}>recorded</span>
          </div>

          {/* Export / Import */}
          <button
            onClick={onOpenExportImport}
            className="btn-secondary"
            title="Export or Import JSON/CSV records"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
          >
            <Download size={14} />
            <span>Data / Export</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="btn-secondary"
            title="Configure observation window, prior parameters, and layout"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
          >
            <Sliders size={14} />
            <span>Settings</span>
          </button>

          {/* Educational Info */}
          <button
            onClick={onOpenHelpModal}
            className="btn-secondary"
            title="Read mathematical foundations & educational disclaimers"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
          >
            <HelpCircle size={14} />
            <span>Guide</span>
          </button>

          {/* Clear Data */}
          <button
            onClick={onOpenClearConfirm}
            className="btn-danger"
            title="Clear all stored session data"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
          >
            <Trash2 size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
