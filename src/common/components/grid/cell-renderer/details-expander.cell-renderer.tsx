import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { CollapseButton } from '../../collapse-button/collapse.button';
import { DETAILS_ROW_ID_SUFFIX, IGridRowDataDetailsExt } from '../grid';

import './details-expander.cell-renderer.css';

interface DetailsExpanderRendererProps extends ICellRendererParams {
  detailsRowCellRendererPresencePredicate?: (data: any) => boolean;
}

export const DetailsExpanderRenderer: React.FC<DetailsExpanderRendererProps> = (
  props
): JSX.Element | null => {
  const shouldRenderBtn =
    props.detailsRowCellRendererPresencePredicate?.(props.data) ?? true;

  const handleCollapseExpand = (): void => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const rowNode = props.api.getRowNode(
      `${props.data?.id as string}${DETAILS_ROW_ID_SUFFIX}`
    );
    const isVisible = (rowNode?.data as IGridRowDataDetailsExt).isVisible;
    rowNode?.setDataValue('isVisible', !isVisible);
    props.api.onFilterChanged();
  };
  if (shouldRenderBtn) return <CollapseButton onClick={handleCollapseExpand} />;

  return null;
};
