import React from 'react';
import { History, ArrowRightLeft } from 'lucide-react';
import { getSlidingSlots } from '../math/slidingWindow';
import type { RouletteResult, UserSettings } from '../types/roulette';

interface SlidingHistoryProps {
  results: RouletteResult[];
  settings: UserSettings;
  onToggleOrder: () => void;
}

export const SlidingHistory: React.FC<SlidingHistoryProps> = ({
  results,
  settings,
  onToggleOrder,
}) => {
  const isChronological = settings.slidingOrder === 'newest-right';
  const slots = getSlidingSlots(
    results,
    isChronological ? 'chronological' : 'newest-left'
  );

  return (
    <section className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1rem',
      }}>
        <div>
          <h2 className="panel-title">
            <History size={18} color="#6366f1" />
            <span>5-Slot Sliding History Window</span>
          </h2>
          <p className="panel-subtitle">
            Dynamic rolling window displaying the 5 most recent outcomes. Complete historical sequence is preserved independently.
          </p>
        </div>

        {/* Layout Orientation Toggle */}
        <button
          onClick={onToggleOrder}
          className="btn-secondary"
          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
          title="Toggle layout direction between Chronological (L->R) and Newest-on-Left"
        >
          <ArrowRightLeft size={13} />
          <span>
            {isChronological
              ? 'Orientation: Left-to-Right (Oldest → Newest)'
              : 'Orientation: Newest-on-Left (Newest → Oldest)'}
          </span>
        </button>
      </div>

      {/* 5-Slot Visual Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '0.85rem',
      }}>
        {slots.map((item, index) => {
          let slotLabel = '';
          if (isChronological) {
            slotLabel = index === 4 ? 'Slot 5 (Newest)' : index === 0 ? 'Slot 1 (Oldest)' : `Slot ${index + 1}`;
          } else {
            slotLabel = index === 0 ? 'Slot 1 (Newest)' : index === 4 ? 'Slot 5 (Oldest)' : `Slot ${index + 1}`;
          }

          if (!item) {
            return (
              <div
                key={`empty-${index}`}
                className="history-slot empty"
                id={`history-slot-${index}`}
              >
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  {slotLabel}
                </span>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.25)',
                  margin: '0.4rem 0',
                }}>
                  [ EMPTY ]
                </div>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.2)' }}>
                  Awaiting spin
                </span>
              </div>
            );
          }

          const isGreen = item.color === 'green' || item.number === 0;
          const isRed = item.color === 'red';
          const isOdd = item.parity === 'odd';

          return (
            <div
              key={`filled-${item.id ?? index}-${item.timestamp}`}
              className={`history-slot filled ${item.color}`}
              id={`history-slot-${index}`}
              style={{
                borderTop: isGreen ? '3px solid #10b981' : isRed ? '3px solid #f43f5e' : '3px solid #64748b',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '0 0.25rem',
                marginBottom: '0.2rem',
              }}>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: isGreen ? '#a7f3d0' : isRed ? '#fda4af' : '#cbd5e1',
                }}>
                  {slotLabel}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  #{results.indexOf(item) + 1}
                </span>
              </div>

              {/* Number */}
              <div style={{
                fontSize: '2.4rem',
                fontWeight: 800,
                lineHeight: 1.1,
                color: '#fff',
                textShadow: isGreen
                  ? '0 0 16px rgba(16, 185, 129, 0.7)'
                  : isRed
                    ? '0 0 16px rgba(225, 29, 72, 0.6)'
                    : '0 0 14px rgba(0,0,0,0.8)',
                fontFamily: 'var(--font-mono)',
              }}>
                {item.number}
              </div>

              {/* Badges: Color and Parity */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginTop: '0.4rem',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}>
                <span className={`badge ${isGreen ? 'badge-green' : isRed ? 'badge-red' : 'badge-black'}`}>
                  {item.color.toUpperCase()}
                </span>
                <span className={`badge ${isGreen ? 'badge-zero' : isOdd ? 'badge-odd' : 'badge-even'}`}>
                  {item.parity === 'none' ? 'ZERO' : item.parity.toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
