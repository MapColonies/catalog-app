import React, { useState } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { Checkbox } from '@map-colonies/react-core';
import { GridRowNode } from '../../../../common/components/grid';
import './footprint.cell-renderer.css';

interface IFootprintCellRendererParams extends ICellRendererParams {
  onClick:  (id: string, value: boolean, node: GridRowNode) => void;
}

export const FootprintRenderer: React.FC<IFootprintCellRendererParams> = (props) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const [checked, setChecked] = useState<boolean>(props.data.footPrintShown as boolean);
  return (
    <Checkbox 
      checked={checked}
      onClick={
        (evt): void => {
          setChecked(evt.currentTarget.checked);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          props.onClick(props.data.id, evt.currentTarget.checked, props.node);
        }}
    />
 );
};
