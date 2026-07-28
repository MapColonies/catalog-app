import React from 'react';

const NO_ENTRY_COLOR = 'var(--mdc-theme-gc-error-high)';

export const NoEntryIcon: React.FC = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      fill="none"
      focusable="false"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke={NO_ENTRY_COLOR} strokeWidth="2.5" />
      <line
        x1="6"
        y1="18"
        x2="18"
        y2="6"
        stroke={NO_ENTRY_COLOR}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
