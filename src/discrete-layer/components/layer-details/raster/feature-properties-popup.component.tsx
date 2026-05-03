import { memo, useCallback, useMemo } from 'react';
import { Feature } from 'geojson';
import { Box } from '@map-colonies/react-components';
import { IconButton, Typography } from '@map-colonies/react-core';
import { dateFormatter } from '../../../../common/helpers/formatters';
import useZoomLevelsTable from '../../export-layer/hooks/useZoomLevelsTable';
import { getStyleByFeatureType } from './pp-map.utils';

const ISO_DATE_TIME_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2})?$/;
const NO_PROPERTIES_MESSAGE_KEY = '__noPropertiesMessage';

const toCssColor = (color: unknown): string | undefined => {
  if (typeof color === 'string') {
    return color;
  }
  if (Array.isArray(color)) {
    return color.length === 4 ? `rgba(${color.join(',')})` : `rgb(${color.join(',')})`;
  }
  return undefined;
};

interface FeaturePropertiesPopupProps {
  selectedFeature?: Feature;
  onClose: () => void;
}

const FeaturePropertiesPopup: React.FC<FeaturePropertiesPopupProps> = ({
  selectedFeature,
  onClose,
}) => {
  const ZOOM_LEVELS_TABLE = useZoomLevelsTable();

  const resolutionDegreeToZoomLevel = useMemo(() => {
    const table = Object.values(ZOOM_LEVELS_TABLE);
    return Object.fromEntries(table.map((value, index) => [String(value), index]));
  }, []);

  const formatPropertyValue = useCallback((value: unknown, key?: string): string => {
    if (value === undefined || value === null) {
      return '';
    }
    if (key === 'resolutionDegree') {
      const zoomLevel = resolutionDegreeToZoomLevel[String(value)];
      return zoomLevel !== undefined ? `${String(value)} (${String(zoomLevel)})` : String(value);
    }
    if (value instanceof Date) {
      return dateFormatter(value, false);
    }
    if (typeof value === 'string') {
      const isDateKey = key !== undefined && /(date|time|utc)/i.test(key);
      const isIsoDateValue = ISO_DATE_TIME_REGEX.test(value.trim());
      if ((isDateKey || isIsoDateValue) && !Number.isNaN(Date.parse(value))) {
        return dateFormatter(value, false);
      }
      return value;
    }
    if (
      typeof value === 'object' &&
      'toISOString' in (value as Record<string, unknown>) &&
      typeof (value as { toISOString?: unknown }).toISOString === 'function'
    ) {
      return dateFormatter(value as Date, false);
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }, []);

  const color = useMemo(() => {
    if (!selectedFeature?.properties) {
      return undefined;
    }
    return toCssColor(getStyleByFeatureType(selectedFeature)?.getStroke()?.getColor());
  }, [selectedFeature?.properties]);

  const visibleProperties = useMemo(() => {
    if (!selectedFeature?.properties) {
      return [] as Array<[string, unknown]>;
    }
    return Object.entries(selectedFeature?.properties).filter(([key]) => {
      return !key.startsWith('_');
    });
  }, [selectedFeature?.properties]);

  if (!selectedFeature?.properties) {
    return null;
  }

  return (
    <Box className="featurePropertiesPopup">
      <Box className="featurePropertiesPopupHeader">
        <Typography className="featurePropertiesPopupTitle" tag="span" style={{ color }}>
          {selectedFeature?.properties?._featureTitle}
        </Typography>
        <IconButton
          className="featurePropertiesPopupClose mc-icon-Close"
          label="CLOSE"
          onClick={onClose}
        />
      </Box>
      <Box className="featurePropertiesPopupRows">
        {visibleProperties.map(([key, value]) => {
          if (key === NO_PROPERTIES_MESSAGE_KEY) {
            return (
              <Box className="featurePropertiesPopupRow" key={key}>
                <Typography className="featurePropertiesPopupValue" tag="span">
                  {formatPropertyValue(value, key)}
                </Typography>
              </Box>
            );
          }

          return (
            <Box className="featurePropertiesPopupRow" key={key}>
              <Typography className="featurePropertiesPopupKey" tag="span">
                {key}
              </Typography>
              <Typography className="featurePropertiesPopupValue" tag="span">
                {formatPropertyValue(value, key)}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export const FeaturePropertiesPopupComponent = memo(FeaturePropertiesPopup);
FeaturePropertiesPopupComponent.displayName = 'FeaturePropertiesPopupComponent';
