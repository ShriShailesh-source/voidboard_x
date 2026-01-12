import React from 'react';
import { SelectionIcon, PenIcon, ArrowIcon, EraserIcon } from './index';

// Minimal toolbar example using custom icons; relies on parent-managed state
// Optional: pass setSelectedId to clear selection when switching off select
export const SimpleToolbar = ({ tool, setTool, setSelectedId }) => {
  const tools = [
    { id: 'select', icon: SelectionIcon },
    { id: 'pen', icon: PenIcon },
    { id: 'arrow', icon: ArrowIcon },
    { id: 'eraser', icon: EraserIcon },
  ];

  return (
    <div style={{ display: 'flex', gap: '10px', padding: '10px', background: '#f0f0f0' }}>
      {tools.map(({ id, icon: Icon }) => {
        const isActive = tool === id;
        return (
          <button
            key={id}
            onClick={() => {
              setTool(id);
              if (setSelectedId && id !== 'select') setSelectedId(null);
            }}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: 'none',
              background: isActive ? '#007bff' : 'transparent',
              cursor: 'pointer'
            }}
          >
            <Icon color={isActive ? 'white' : '#333'} size={20} />
          </button>
        );
      })}
    </div>
  );
};
