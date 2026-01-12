// UI/UX Styling Constants

export const buttonStyles = {
  base: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #3f3f46',
    backgroundColor: '#18181b',
    color: '#a1a1aa',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '12px',
    fontWeight: '600'
  },
  hover: {
    backgroundColor: '#27272a',
    color: '#fff'
  },
  active: {
    backgroundColor: '#3b82f6',
    color: '#fff'
  },
  disabled: {
    cursor: 'not-allowed',
    opacity: 0.5
  }
};

export const iconButtonStyles = {
  base: {
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid #3f3f46',
    backgroundColor: '#18181b',
    color: '#a1a1aa',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  hover: {
    backgroundColor: '#27272a',
    color: '#fff'
  },
  active: {
    backgroundColor: '#3b82f6',
    color: '#fff'
  }
};

export const panelStyles = {
  base: {
    position: 'fixed',
    backgroundColor: 'var(--panel-bg)',
    border: '1px solid var(--panel-border)',
    borderRadius: '12px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backdropFilter: 'blur(14px)',
    boxShadow: '10px 14px 30px rgba(0,0,0,0.32)'
  }
};

export const toolContainerStyles = {
  display: 'flex',
  gap: '4px',
  backgroundColor: 'var(--panel-bg)',
  border: '1px solid var(--panel-border)',
  borderRadius: '10px',
  padding: '6px',
  boxShadow: '8px 8px 18px rgba(0,0,0,0.28), -6px -6px 16px rgba(255,255,255,0.04)'
};

export const toolButtonStyles = {
  base: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.04)',
    cursor: 'pointer',
    transform: 'translateY(0)',
    transition: 'transform 0.18s ease, background-color 0.2s, color 0.2s',
    boxShadow: '6px 6px 12px rgba(0,0,0,0.25), -6px -6px 12px rgba(255,255,255,0.05)'
  },
  active: {
    backgroundColor: 'rgba(59,130,246,0.18)',
    color: '#fff'
  },
  inactive: {
    backgroundColor: 'transparent',
    color: 'var(--panel-text)'
  },
  hover: {
    backgroundColor: '#27272a',
    color: '#fff'
  }
};

export const modalStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(8px)'
  },
  content: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #3f3f46',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
  }
};
