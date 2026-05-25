import React, { useLayoutEffect, useRef, useState } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { CollapseButton } from '../../collapse-button/collapse.button';
import { IGridRowDataDetailsExt } from '../grid';

import './details-expander.cell-renderer.css';

interface DetailsExpanderRendererProps extends ICellRendererParams {
  detailsRowCellRendererPresencePredicate?: (data: any) => boolean;
  detailsComponent?: React.ComponentType<ICellRendererParams>;
  normalRowHeight?: number;
  detailsRowHeight?: number;
}

export const DetailsExpanderRenderer: React.FC<DetailsExpanderRendererProps> = (
  props
): JSX.Element | null => {
  const {
    detailsRowCellRendererPresencePredicate,
    detailsComponent: DetailsComponent,
    normalRowHeight = 42,
    detailsRowHeight = 230,
    ...rendererParams
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
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
    if (!isDetailsExpanded || !containerRef.current) {
      setOverlayStyle(null);
      return;
    }

    // TODO: ag-grid maybe fragile
    const cell = containerRef.current.closest('.ag-cell') as HTMLElement | null;
    const row = cell?.closest('.ag-row') as HTMLElement | null;
    if (cell && row) {
      // TODO: maybe take the css from somewhere else
      setOverlayStyle({
        position: 'absolute',
        top: normalRowHeight,
        left: -cell.offsetLeft,
        width: row.offsetWidth,
        height: detailsRowHeight,
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 2,
        display: 'flex',
        backgroundColor: 'var(--ag-background-color)',
      });
    }
  }, [isDetailsExpanded, normalRowHeight, detailsRowHeight]);

  return (
    <div ref={containerRef} className="expanderContainer">
      {shouldRenderBtn && <CollapseButton onClick={handleCollapseExpand} />}
      {isDetailsExpanded && DetailsComponent && overlayStyle && (
        <div style={overlayStyle}>
          <DetailsComponent {...rendererParams} data={props.data} />
        </div>
      )}
    </div>
  );
};
