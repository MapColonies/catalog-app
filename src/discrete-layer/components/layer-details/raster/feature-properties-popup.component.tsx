import { memo, useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Feature } from 'geojson';
import { Box } from '@map-colonies/react-components';
import { IconButton, Typography } from '@map-colonies/react-core';
import { dateFormatter } from '../../../../common/helpers/formatters';
import useZoomLevelsTable from '../../export-layer/hooks/useZoomLevelsTable';
import { FeatureType, PPMapStyles } from './pp-map.utils';

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
  const intl = useIntl();
  const ZOOM_LEVELS_TABLE = useZoomLevelsTable();
  const resolutionDegreeToZoomLevel = useMemo(() => {
    const table = Object.values(ZOOM_LEVELS_TABLE);
    return Object.fromEntries(table.map((value, index) => [String(value), index]));
  }, [ZOOM_LEVELS_TABLE]);

  const formatPropertyKey = useCallback((key: string): string => {
    return intl.formatMessage(
      { id: `polygon-parts.map-preview.feature-property.${key}`, defaultMessage: key }
    );
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
  }, [resolutionDegreeToZoomLevel]);

  const selectedFeatureProperties = selectedFeature?.properties as Record<string, unknown> | undefined;

  const title = useMemo((): string => {
    if (!selectedFeatureProperties) {
      return '';
    }
    return String(selectedFeatureProperties?._featureTitle ?? '');
  }, [selectedFeatureProperties]);

  const color = useMemo(() => {
    if (!selectedFeatureProperties) {
      return undefined;
    }

    if (selectedFeatureProperties?._featureType === FeatureType.LOW_RESOLUTION_PP) {
      return toCssColor(PPMapStyles.get(FeatureType.LOW_RESOLUTION_PP)?.getStroke()?.getColor());
    }
    if (selectedFeatureProperties?.exceeded === true) {
      return '#d32f2f';
    }
    if (selectedFeatureProperties?._featureType === FeatureType.EXISTING_PP) {
      return toCssColor(PPMapStyles.get(FeatureType.EXISTING_PP)?.getStroke()?.getColor());
    }
    return undefined;
  }, [selectedFeatureProperties]);

  const visibleProperties = useMemo(() => {
    if (!selectedFeatureProperties) {
      return [] as Array<[string, unknown]>;
    }

    return Object.entries(selectedFeatureProperties).filter(([key]) => {
      if (key === NO_PROPERTIES_MESSAGE_KEY) {
        return true;
      }
      return !key.startsWith('_');
    });
  }, [selectedFeatureProperties]);

  if (!selectedFeatureProperties) {
    return null;
  }

  return (
    <Box className="featurePropertiesPopup">
      <Box className="featurePropertiesPopupHeader">
        <Typography className="featurePropertiesPopupTitle" tag="span" style={{ color }}>
          {title}
        </Typography>
        <IconButton
          className="featurePropertiesPopupClose mc-icon-Close"
          label="CLOSE"
          onClick={onClose}
        />
      </Box>
      <Box className="featurePropertiesPopupRows">
        {visibleProperties
          .map(([key, value]) => {
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
                {formatPropertyKey(key)}
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
