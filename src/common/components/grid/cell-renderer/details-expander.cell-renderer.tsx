import React, { useLayoutEffect, useState } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { Box } from '@map-colonies/react-components';
import { CollapseButton } from '../../collapse-button/collapse.button';
import {
  DEFAULT_DETAILS_ROW_HEIGHT,
  DEFAULT_NORMAL_ROW_HEIGHT,
  IGridRowDataDetailsExt,
} from '../grid';

import './details-expander.cell-renderer.css';

interface DetailsExpanderRendererProps extends ICellRendererParams {
  detailsComponent: React.ComponentType<ICellRendererParams>;
  detailsRowCellRendererPresencePredicate?: (data: any) => boolean;
  normalRowHeight?: number;
  detailsRowHeight?: number;
}

export const DetailsExpanderRenderer: React.FC<DetailsExpanderRendererProps> = (
  props
): JSX.Element | null => {
  const {
    detailsRowCellRendererPresencePredicate,
    detailsComponent,
    normalRowHeight = DEFAULT_NORMAL_ROW_HEIGHT,
    detailsRowHeight = DEFAULT_DETAILS_ROW_HEIGHT,
    ...rendererParams
  } = props;

  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties | null>(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(
    (props.data as IGridRowDataDetailsExt).isDetailsExpanded ?? false
  );

  const shouldRenderBtn = detailsRowCellRendererPresencePredicate?.(props.data) ?? true;

  const handleCollapseExpand = (): void => {
    const newVal = !isDetailsExpanded;
    setIsDetailsExpanded(newVal);
    props.node.setDataValue('isDetailsExpanded', newVal);
    props.api.resetRowHeights();
  };

  useLayoutEffect(() => {
    if (!isDetailsExpanded) {
      setOverlayStyle(null);
      return;
    }

    const cell = props.eGridCell as HTMLElement;
    const row = cell.parentElement as HTMLElement | null;
    if (row) {
      setOverlayStyle({
        position: 'absolute',
        top: normalRowHeight,
        left: -cell.offsetLeft,
        width: row.offsetWidth,
        height: detailsRowHeight,
        overflow: 'hidden',
        zIndex: 2,
        display: 'flex',
        backgroundColor: 'var(--ag-background-color)',
      });
    }
  }, [isDetailsExpanded, normalRowHeight, detailsRowHeight]);

  return (
    <Box className="expanderContainer">
      {shouldRenderBtn && <CollapseButton onClick={handleCollapseExpand} />}
      {isDetailsExpanded && overlayStyle && (
        <Box style={overlayStyle}>
          <props.detailsComponent {...rendererParams} data={props.data} />
        </Box>
      )}
    </Box>
  );
};
