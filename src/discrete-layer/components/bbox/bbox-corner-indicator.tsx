import React, { useMemo } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

interface BBoxCornerProps {
  corner: Corner;
  className?: string;
}

export enum Corner {
  TOP_RIGHT = 'TOP_RIGHT',
  BOTTOM_RIGHT = 'BOTTOM_RIGHT',
  BOTTOM_LEFT = 'BOTTOM_LEFT',
  TOP_LEFT = 'TOP_LEFT',
  UNKNOWN = 'UNKNOWN',
}

const useStyle = makeStyles((theme: Theme) =>
  createStyles({
    bbox: {
      overflow: 'hidden',
      position: 'relative',
      border: 'solid 1px',
      width: '60px',
      height: '56px',
    },

    bboxLeftBottomCorner: {
      '&::before': {
        margin: '-1em',
        borderRadius: '50%',
        position: 'absolute',
        padding: '1em',
        boxShadow: '0 0 7px #b53',
        background: '#95a',
        content: "''",
        bottom: 0,
        left: 0,
      },
    },
    bboxLeftTopCorner: {
      '&::before': {
        margin: '-1em',
        borderRadius: '50%',
        position: 'absolute',
        padding: '1em',
        boxShadow: '0 0 7px #b53',
        background: '#95a',
        content: "''",
        top: 0,
        left: 0,
      },
    },
    bboxRightTopCorner: {
      '&::before': {
        margin: '-1em',
        borderRadius: '50%',
        position: 'absolute',
        padding: '1em',
        boxShadow: '0 0 7px #b53',
        background: '#95a',
        content: "''",
        top: 0,
        right: 0,
      },
    },
    bboxRightBottomCorner: {
      '&::before': {
        margin: '-1em',
        borderRadius: '50%',
        position: 'absolute',
        padding: '1em',
        boxShadow: '0 0 7px #b53',
        background: '#95a',
        content: "''",
        bottom: 0,
        right: 0,
      },
    },
  })
);

const getCornerClass = (
  classes: Record<string, string>,
  cornerToIndicate: Corner
): string => {
  switch (cornerToIndicate) {
    case Corner.TOP_RIGHT:
      return classes.bboxRightTopCorner;
    case Corner.TOP_LEFT:
      return classes.bboxLeftTopCorner;
    case Corner.BOTTOM_RIGHT:
      return classes.bboxRightBottomCorner;
    case Corner.BOTTOM_LEFT:
      return classes.bboxLeftBottomCorner;
    default:
      return '';
  }
};

export const BBoxCorner: React.FC<BBoxCornerProps> = ({
  corner,
  className,
}) => {
  const classes = useStyle();
  const bboxCorner = useMemo(
    () => getCornerClass(classes, corner),
    [classes, corner]
  );
  return (
    <div className={`${classes.bbox} ${bboxCorner} ${className ?? ''}`}></div>
  );
};
