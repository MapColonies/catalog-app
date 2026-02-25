import { get } from 'lodash';
import React from 'react';
import {
  default as RLSkeleton,
  SkeletonProps as RLSkeletonProps,
} from 'react-loading-skeleton';
import { useTheme } from '@map-colonies/react-core';
import CONFIG from '../../../common/config';

import 'react-loading-skeleton/dist/skeleton.css';

const direction =
  CONFIG.I18N.DEFAULT_LANGUAGE.toUpperCase() === 'HE' ? 'rtl' : 'ltr';

interface SkeletonProps extends RLSkeletonProps {}

export const Skeleton: React.FC<SkeletonProps> = ({ ...rest }) => {
  const theme = useTheme();
  const GC_SKELETON_BASE = get(
    theme,
    'custom.GC_SKELETON_BASE',
    'rgba(235, 235, 235, 0.1)'
  ) as string;
  const GC_SKELETON_HIGHLIGHT = get(
    theme,
    'custom.GC_SKELETON_HIGHLIGHT',
    'rgba(175, 191, 218, 0.4)'
  ) as string;

  return (
    <RLSkeleton
      direction={direction}
      baseColor={GC_SKELETON_BASE}
      highlightColor={GC_SKELETON_HIGHLIGHT}
      duration={3}
      customHighlightBackground={`linear-gradient(
        90deg,
        ${GC_SKELETON_BASE} 0%,
        ${GC_SKELETON_HIGHLIGHT} 50%,
        ${GC_SKELETON_BASE} 100%
      )`}
      {...rest}
    />
  );
};
