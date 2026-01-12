import React from 'react';

// Shared wrapper to keep size/color/stroke consistent
const IconWrapper = ({ children, color = 'currentColor', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

export const PenIcon = (props) => (
  <IconWrapper {...props}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </IconWrapper>
);

export const ArrowIcon = (props) => (
  <IconWrapper {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </IconWrapper>
);

export const SelectionIcon = (props) => (
  <IconWrapper {...props}>
    <path d="M5 3H3v2" />
    <path d="M9 3h2" />
    <path d="M13 3h2" />
    <path d="M19 3h2v2" />
    <path d="M21 9v2" />
    <path d="M21 13v2" />
    <path d="M21 19h-2v2" />
    <path d="M15 21h-2" />
    <path d="M11 21H9" />
    <path d="M5 21H3v-2" />
    <path d="M3 15v-2" />
    <path d="M3 11V9" />
  </IconWrapper>
);

export const EraserIcon = (props) => (
  <IconWrapper {...props}>
    <path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z" />
    <path d="M17 17L7 7" />
  </IconWrapper>
);

export const SquareIcon = (props) => (
  <IconWrapper {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  </IconWrapper>
);
