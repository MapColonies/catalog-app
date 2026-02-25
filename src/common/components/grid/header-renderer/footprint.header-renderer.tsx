import React, { useState } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { Checkbox } from '@map-colonies/react-core';
import { GridApi } from '..';

import './footprint.header-renderer.css';

interface IFootprintCellRendererParams extends ICellRendererParams {
  isChecked: boolean;
  onClick: (value: boolean, gridApi: GridApi) => void;
}

export const HeaderFootprintRenderer: React.FC<IFootprintCellRendererParams> = (
  props
) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const [checked, setChecked] = useState<boolean>(props.isChecked);
  return (
    <Checkbox
      checked={checked}
      onClick={(evt: React.MouseEvent<HTMLInputElement>): void => {
        setChecked(evt.currentTarget.checked);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        props.onClick(evt.currentTarget.checked, props.api);
      }}
    />
  );
};
