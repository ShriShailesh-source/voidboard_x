import React from 'react';
import { Undo, Redo } from 'lucide-react';
import { buttonStyles, iconButtonStyles } from './styles';

export const Toolbar = ({
  undo,
  redo,
  historyIndex,
  history,
  controlsCollapsed,
  setControlsCollapsed,
  showSnapshotModal,
  setShowSnapshotModal,
  showHistoryPanel,
  setShowHistoryPanel,
  showTagModal,
  setShowTagModal,
  showInfoModal,
  setShowInfoModal,
  showTutorial,
  setShowTutorial,
  snapToGrid,
  setSnapToGrid,
  theme,
  setTheme,
  exportToJSON,
  importFromJSON,
  moveLayer,
  selectedId,
  elements
}) => {
  return (
    <div style={{ 
      position: 'fixed', 
      top: '16px', 
      left: '16px', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      backgroundColor: 'var(--panel-bg)', 
      border: '1px solid var(--panel-border)', 
      borderRadius: '14px', 
      padding: '10px', 
      backdropFilter: 'blur(12px)', 
      boxShadow: '8px 12px 32px rgba(0,0,0,0.35)' 
    }}>
      
      {/* LEFT HALF (collapsible) */}
      <div style={{ display: controlsCollapsed ? 'none' : 'flex', alignItems: 'center', gap: '8px' }}>
        
        {/* Snapshot Button */}
        <button
          onClick={() => setShowSnapshotModal(true)}
          style={buttonStyles.base}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonStyles.hover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonStyles.base)}
          title="Save snapshot"
        >
          📸 Snapshot
        </button>
        
        {/* Import Button */}
        <button
          onClick={importFromJSON}
          style={buttonStyles.base}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonStyles.hover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonStyles.base)}
          title="Import from JSON (Ctrl+I)"
        >
          📂
        </button>

        {/* Export PNG */}
        <button
          onClick={() => {
            const canvas = document.querySelector('canvas');
            if (!canvas) return;
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = `voidboard-${Date.now()}.png`;
            a.click();
          }}
          style={buttonStyles.base}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonStyles.hover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonStyles.base)}
          title="Export PNG"
        >
          🖼 PNG
        </button>

        {/* Share link */}
        <button
          onClick={() => {
            const link = window.location.href;
            if (navigator.clipboard) {
              navigator.clipboard.writeText(link);
              alert('Link copied to clipboard');
            } else {
              prompt('Copy this link', link);
            }
          }}
          style={buttonStyles.base}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonStyles.hover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonStyles.base)}
          title="Copy board link"
        >
          🔗 Share
        </button>

        {/* Snap Toggle */}
        <button
          onClick={() => setSnapToGrid(v => !v)}
          style={{...buttonStyles.base, backgroundColor: snapToGrid ? '#3b82f6' : '#18181b', color: snapToGrid ? '#fff' : '#a1a1aa'}}
          onMouseEnter={(e) => !snapToGrid && Object.assign(e.currentTarget.style, buttonStyles.hover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, {backgroundColor: snapToGrid ? '#3b82f6' : '#18181b', color: snapToGrid ? '#fff' : '#a1a1aa'})}
          title="Snap to grid"
        >
          ⬚ Snap
        </button>
        
        {/* Layer Controls */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => moveLayer('back')}
            disabled={!selectedId}
            style={{...iconButtonStyles.base, color: selectedId ? '#a1a1aa' : '#52525b', cursor: selectedId ? 'pointer' : 'not-allowed'}}
            onMouseEnter={(e) => selectedId && Object.assign(e.currentTarget.style, {backgroundColor: '#27272a', color: '#fff'})}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, {backgroundColor: '#18181b', color: selectedId ? '#a1a1aa' : '#52525b'})}
            title="Send to back"
          >
            ⬇ Layer
          </button>
          <button
            onClick={() => moveLayer('front')}
            disabled={!selectedId}
            style={{...iconButtonStyles.base, color: selectedId ? '#a1a1aa' : '#52525b', cursor: selectedId ? 'pointer' : 'not-allowed'}}
            onMouseEnter={(e) => selectedId && Object.assign(e.currentTarget.style, {backgroundColor: '#27272a', color: '#fff'})}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, {backgroundColor: '#18181b', color: selectedId ? '#a1a1aa' : '#52525b'})}
            title="Bring to front"
          >
            ⬆ Layer
          </button>
        </div>
        
        {/* About / Info */}
        <button
          onClick={() => setShowInfoModal(true)}
          style={buttonStyles.base}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonStyles.hover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonStyles.base)}
        >
          ℹ️ Info
        </button>

        {/* Tutorial */}
        <button
          onClick={() => setShowTutorial(true)}
          style={buttonStyles.base}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonStyles.hover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonStyles.base)}
        >
          ❓ Tutorial
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          style={buttonStyles.base}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonStyles.hover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonStyles.base)}
          title="Toggle dark/light"
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>

      {/* PANEL BUTTON */}
      <button
        onClick={() => setShowHistoryPanel(v => !v)}
        style={{...buttonStyles.base, backgroundColor: showHistoryPanel ? '#3b82f6' : '#18181b', color: showHistoryPanel ? '#fff' : '#a1a1aa'}}
        onMouseEnter={(e) => !showHistoryPanel && Object.assign(e.currentTarget.style, buttonStyles.hover)}
        onMouseLeave={(e) => Object.assign(e.currentTarget.style, {backgroundColor: showHistoryPanel ? '#3b82f6' : '#18181b', color: showHistoryPanel ? '#fff' : '#a1a1aa'})}
        title="Show history & snapshots"
      >
        📜 Panel
      </button>

      {/* Collapse Toggle */}
      <button
        onClick={() => setControlsCollapsed(v => !v)}
        style={{...iconButtonStyles.base, padding: '8px 10px'}}
        onMouseEnter={(e) => Object.assign(e.currentTarget.style, {backgroundColor: '#27272a', color: '#fff'})}
        onMouseLeave={(e) => Object.assign(e.currentTarget.style, {backgroundColor: '#18181b', color: '#a1a1aa'})}
        title={controlsCollapsed ? 'Expand left controls' : 'Collapse left controls'}
      >
        {controlsCollapsed ? '⮞' : '⮜'}
      </button>

      {/* Undo Button (RIGHT HALF) */}
      <button
        onClick={() => undo()}
        disabled={historyIndex === 0}
        style={{...iconButtonStyles.base, color: historyIndex === 0 ? '#52525b' : '#a1a1aa', cursor: historyIndex === 0 ? 'not-allowed' : 'pointer'}}
        onMouseEnter={(e) => historyIndex > 0 && Object.assign(e.currentTarget.style, {backgroundColor: '#27272a', color: '#fff'})}
        onMouseLeave={(e) => Object.assign(e.currentTarget.style, {backgroundColor: '#18181b', color: historyIndex === 0 ? '#52525b' : '#a1a1aa'})}
        title="Undo (Ctrl+Z)"
      >
        <Undo size={18} />
      </button>

      {/* Redo Button */}
      <button
        onClick={() => redo()}
        disabled={historyIndex >= history.length - 1}
        style={{...iconButtonStyles.base, color: historyIndex >= history.length - 1 ? '#52525b' : '#a1a1aa', cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer'}}
        onMouseEnter={(e) => historyIndex < history.length - 1 && Object.assign(e.currentTarget.style, {backgroundColor: '#27272a', color: '#fff'})}
        onMouseLeave={(e) => Object.assign(e.currentTarget.style, {backgroundColor: '#18181b', color: historyIndex >= history.length - 1 ? '#52525b' : '#a1a1aa'})}
        title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
      >
        <Redo size={18} />
      </button>
    </div>
  );
};
