import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Box, useMap } from '@map-colonies/react-components';

import './zoom-level-indicator.css';

const formatZoomLevelValue = (zoomLevel?: number): string => {
  if (zoomLevel === undefined || Number.isNaN(zoomLevel)) {
    return '-';
  }
  const roundedZoomLevel = Math.round(zoomLevel);
  if (Math.abs(zoomLevel - roundedZoomLevel) < 0.01) {
    return roundedZoomLevel.toString();
  }
  return zoomLevel.toFixed(1);
};

export const ZoomLevelIndicator: React.FC = () => {
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

  return (
    <Box className="zoomLevelIndicatorContainer">
      <Box className="zoomLevelIndicator">
        <Box className="zoomLevelIndicatorValue">{formatZoomLevelValue(zoomLevel)}</Box>
        <Box className="zoomLevelIndicatorLabel"><FormattedMessage id="map.zoom.label" /></Box>
      </Box>
    </Box>
  );
};
