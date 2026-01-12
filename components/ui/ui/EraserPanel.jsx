import React from 'react';
import { panelStyles } from './styles';

export const EraserPanel = ({
  eraserMode,
  setEraserMode,
  eraserSize,
  setEraserSize,
  tool
}) => {
  if (tool !== 'eraser') return null;

  return (
    <div style={{ ...panelStyles, top: '70px', left: '16px', minWidth: '240px' }}>
      <div style={{ color: '#d4d4d8', fontSize: '12px', fontWeight: '700' }}>Eraser Settings</div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ color: '#a1a1aa', fontSize: '12px' }}>Mode</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'point', label: 'Point', desc: 'Click to delete' },
            { id: 'brush', label: 'Brush', desc: 'Drag to erase' },
            { id: 'shape', label: 'Area', desc: 'Drag rectangle' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setEraserMode(mode.id)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid var(--panel-border)',
                backgroundColor: eraserMode === mode.id ? '#ef4444' : 'transparent',
                color: eraserMode === mode.id ? '#fff' : 'var(--panel-text)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              title={mode.desc}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {(eraserMode === 'brush' || eraserMode === 'shape') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: '#a1a1aa', fontSize: '12px' }}>Size: {eraserSize}px</label>
          <input
            type="range"
            min="5"
            max="100"
            value={eraserSize}
            onChange={(e) => setEraserSize(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>
      )}
    </div>
  );
};
