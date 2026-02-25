import React, { useState } from 'react';
import { Icon } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { LayerRasterRecordModelType } from '../../../../discrete-layer/models';

import './import.icon-renderer.css';

interface IImportCellRendererParams {
  onClick: (data: LayerRasterRecordModelType, isSelected: boolean) => void;
  data: LayerRasterRecordModelType;
}

export const ImportRenderer: React.FC<IImportCellRendererParams> = (props) => {
  const [selected, setSelected] = useState<boolean>(
    props.data.isNewlyAddedToBest as boolean
  );

  return (
    <Box>
      <Icon
        className="importIcon"
        icon={{
          icon: selected ? 'check_circle' : 'radio_button_unchecked',
          size: 'small',
        }}
        label="IMPORT"
        onClick={(evt: React.MouseEvent<HTMLElement>): void => {
          const value = !selected;
          evt.stopPropagation();
          setSelected(value);
          props.onClick(props.data, value);
        }}
      />
    </Box>
  );
};
