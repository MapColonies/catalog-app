import React from 'react';

interface ActiveIconProps {
  isFiltered: boolean;
  color: {
    active: string;
    inactive: string;
  };
}

export const ActiveLayersIcon: React.FC<ActiveIconProps> = ({
  isFiltered,
  color,
}) => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      fill={isFiltered ? color.active : color.inactive}
    >
      <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z" />
    </svg>
  );
};
