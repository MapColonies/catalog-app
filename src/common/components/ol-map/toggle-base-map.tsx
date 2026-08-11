import { Box } from '@map-colonies/react-components';
import { IconButton, Tooltip, useTheme } from '@map-colonies/react-core';
import { ActiveLayersIcon } from '../../../icons/4font/ActiveLayers';

import './toggle-base-map.css';

interface ToggleBaseMapProps {
  enableLabel: string;
  disableLabel: string;
  isBaseMapVisible: boolean;
  onToggle: () => void;
}

export const ToggleBaseMap: React.FC<ToggleBaseMapProps> = (props) => {
  const theme = useTheme();

  return (
    <>
      <Box id="baseMap" className="ol-control">
        <Tooltip content={props.isBaseMapVisible ? props.enableLabel : props.disableLabel}>
          <IconButton
            type="button"
            className="showOnMapContainer"
            icon={
              <ActiveLayersIcon
                isFiltered={props.isBaseMapVisible}
                color={{
                  active: theme.primary,
                  inactive: theme.textIconOnBackground,
                }}
              />
            }
            onClick={(): void => {
              props.onToggle();
            }}
          />
        </Tooltip>
      </Box>
    </>
  );
};
