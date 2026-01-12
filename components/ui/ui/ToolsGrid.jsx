import React from 'react';
import { toolContainerStyles, toolButtonStyles } from './styles';

export const ToolsGrid = ({
  tools,
  tool,
  setTool,
  setSelectedId,
  selectedId,
  elements,
  showTagModal,
  setShowTagModal
}) => {
  return (
    <>
      {/* Tags Button - only show if pin is selected */}
      {selectedId && elements.find(el => el.id === selectedId)?.type === 'pin' && (
        <button
          onClick={() => setShowTagModal(true)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #3f3f46',
            backgroundColor: '#3b82f6',
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '12px',
            fontWeight: '600'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
          title="Manage Tags"
        >
          🏷️ Tags
        </button>
      )}
      
      <div style={toolContainerStyles}>
        {tools.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => {
              setTool(id);
              if (id !== 'select') setSelectedId(null);
            }}
            style={{
              ...toolButtonStyles.base,
              backgroundColor: tool === id ? 'rgba(59,130,246,0.18)' : 'transparent',
              color: tool === id ? '#fff' : 'var(--panel-text)',
            }}
            onMouseEnter={(e) => {
              if (tool !== id) {
                e.target.style.backgroundColor = '#27272a';
                e.target.style.color = '#fff';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (tool !== id) {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#a1a1aa';
                e.target.style.transform = 'translateY(0)';
              }
            }}
            title={label}
          >
            <Icon size={18} />
          </button>
        ))}
      </div>
    </>
  );
};
