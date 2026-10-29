import React from 'react';
import { Button, Icon, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';

import './breadcrumb.css';

export interface BreadcrumbProps {
  items: { key: string; label: string }[];
  onCrumbClick?: (key: string) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onCrumbClick }) => {
  return (
    <Box className="breadcrumb" role="navigation">
      <Icon
        aria-hidden="true"
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" focusable="false">
            <circle cx="12" cy="12" r="8" />
          </svg>
        }
      />
      {items.map(({ key, label }, index) => (
        <React.Fragment key={key}>
          {index > 0 && (
            <Typography tag="span" className="breadcrumbSeparator" aria-hidden="true">
              /
            </Typography>
          )}
          {index < items.length - 1 ? (
            <Button
              type="button"
              className="breadcrumbLink"
              onClick={(): void => onCrumbClick?.(key)}
            >
              {label}
            </Button>
          ) : (
            <Typography tag="span" aria-current="page">
              {label}
            </Typography>
          )}
        </React.Fragment>
      ))}
    </Box>
  );
};
