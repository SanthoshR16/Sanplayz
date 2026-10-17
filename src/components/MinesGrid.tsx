import React from 'react';
import { Target, Bomb, CheckCircle2 } from 'lucide-react';

interface MinesGridProps {
  suggestedTiles: number[]; // Tile indices 0 to 24 suggested by model
  actualBombTiles?: number[]; // Actual bomb indices 0 to 24 if evaluating a round
  markedBombTiles?: number[]; // User-marked actual bombs on board
  onTileClick?: (tileIndex: number) => void; // Click to mark/unmark bomb location
  evaluationMode?: boolean; // True when showing evaluation comparison
}

export const MinesGrid: React.FC<MinesGridProps> = ({
  suggestedTiles,
  actualBombTiles = [],
  markedBombTiles = [],
  onTileClick,
  evaluationMode = false,
}) => {
  const suggestedSet = new Set(suggestedTiles);
  const actualBombSet = new Set(actualBombTiles);
  const markedBombSet = new Set(markedBombTiles);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 460 }}>
      {/* 5x5 Grid Container */}
      <div
        role="grid"
        aria-label="5x5 Mines Tile Grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '0.6rem',
          width: '100%',
          aspectRatio: '1 / 1',
          padding: '0.85rem',
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.35)',
        }}
      >
        {Array.from({ length: 25 }, (_, index) => {
          const label = index + 1;
          const isSuggested = suggestedSet.has(index);
          const isActualBomb = actualBombSet.has(index);
          const isMarkedBomb = markedBombSet.has(index);

          let bgColor = 'rgba(30, 41, 59, 0.85)';
          let borderColor = 'rgba(255, 255, 255, 0.12)';
          let textColor = 'var(--text-secondary)';

          if (evaluationMode) {
            if (isActualBomb) {
              bgColor = 'rgba(225, 29, 72, 0.25)';
              borderColor = '#e11d48';
              textColor = '#fb7185';
            } else if (isSuggested) {
              bgColor = 'rgba(16, 185, 129, 0.25)';
              borderColor = '#10b981';
              textColor = '#34d399';
            }
          } else if (isMarkedBomb) {
            bgColor = 'rgba(225, 29, 72, 0.35)';
            borderColor = '#e11d48';
            textColor = '#fb7185';
          } else if (isSuggested) {
            bgColor = 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(79, 70, 229, 0.45) 100%)';
            borderColor = '#818cf8';
            textColor = '#c7d2fe';
          }

          return (
            <div
              key={index}
              role="gridcell"
              aria-label={`Tile ${label}${isSuggested ? ' - Model Suggested' : ''}${isMarkedBomb ? ' - Marked Bomb' : ''}`}
              onClick={() => onTileClick?.(index)}
              title={onTileClick ? `Click to mark/unmark bomb at Tile ${label}` : undefined}
              style={{
                background: bgColor,
                border: `1.5px solid ${borderColor}`,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                aspectRatio: '1 / 1',
                position: 'relative',
                boxShadow: isMarkedBomb
                  ? '0 0 14px rgba(225, 29, 72, 0.5)'
                  : isSuggested
                  ? '0 0 14px rgba(99, 102, 241, 0.35)'
                  : '0 2px 4px rgba(0, 0, 0, 0.25)',
                userSelect: 'none',
                cursor: onTileClick ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
            >
              {evaluationMode && isActualBomb ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Bomb size={22} color="#fb7185" />
                  <span style={{ fontSize: '0.62rem', color: '#fca5a5', fontWeight: 700 }}>BOMB</span>
                </div>
              ) : evaluationMode && isSuggested ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <CheckCircle2 size={22} color="#34d399" />
                  <span style={{ fontSize: '0.62rem', color: '#6ee7b7', fontWeight: 700 }}>SAFE</span>
                </div>
              ) : isMarkedBomb ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Bomb size={20} color="#fb7185" />
                  <span style={{ fontSize: '0.62rem', color: '#fca5a5', fontWeight: 800 }}>
                    {isSuggested ? 'BOMB HIT!' : 'BOMB'}
                  </span>
                </div>
              ) : (
                <>
                  <span
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: isSuggested ? 800 : 700,
                      color: textColor,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {label}
                  </span>
                  {isSuggested && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        fontSize: '0.62rem',
                        color: '#a5b4fc',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                      }}
                    >
                      <Target size={9} />
                      <span>PICK</span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
