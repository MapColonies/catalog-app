import { useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Box, useMap } from '@map-colonies/react-components';

import './zoom-level-indicator.css';

const formatZoomLevelValue = (zoomLevel?: number): string => {
  if (zoomLevel === undefined || Number.isNaN(zoomLevel)) {
    return '-';
  }
  return Math.trunc(zoomLevel).toString();
};

interface ZoomLevelIndicatorProps {
  indicateTillZoomLevel?: number;
}

export const ZoomLevelIndicator: React.FC<ZoomLevelIndicatorProps> = ({
  indicateTillZoomLevel,
}) => {
  const map = useMap();
  const [zoomLevel, setZoomLevel] = useState<number | undefined>(map.getView().getZoom());

  useEffect(() => {
    const view = map.getView();

    const updateZoomLevel = (): void => {
      setZoomLevel(view.getZoom());
    };

    updateZoomLevel();
    view.on('change:resolution', updateZoomLevel);

    return (): void => {
      view.un('change:resolution', updateZoomLevel);
    };
  }, []);

  const blinkClass = useMemo(() => {
    return indicateTillZoomLevel && (!zoomLevel || zoomLevel < indicateTillZoomLevel)
      ? 'blink-constantly'
      : '';
  }, [zoomLevel, indicateTillZoomLevel]);

  return (
    <Box className={`zoomLevelIndicatorContainer ${blinkClass}`}>
      <Box className="zoomLevelIndicator">
        <Box className="zoomLevelIndicatorValue">{formatZoomLevelValue(zoomLevel)}</Box>
        <Box className="zoomLevelIndicatorLabel">
          <FormattedMessage id="map.zoom.label" />
        </Box>
      </Box>
    </Box>
  );
};
