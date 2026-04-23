import { Box } from '@map-colonies/react-components';
import { IconButton, Typography } from '@map-colonies/react-core';
import { FeatureType, PPMapStyles } from './pp-map.utils';

const FEATURE_LABEL_KEY = '_featureLabel';
const NO_PROPERTIES_MESSAGE_KEY = '__noPropertiesMessage';

interface FeaturePropertiesPopupProps {
  selectedFeatureProperties?: Record<string, unknown>;
  selectedExistingFeature?: unknown;
  onClose: () => void;
  formatPropertyValue: (value: unknown, key?: string) => string;
  formatPropertyKey: (key: string) => string;
}

export const FeaturePropertiesPopupComponent: React.FC<FeaturePropertiesPopupProps> = ({
  selectedFeatureProperties,
  selectedExistingFeature,
  onClose,
  formatPropertyValue,
  formatPropertyKey,
}) => {
  if (!selectedFeatureProperties) {
    return null;
  }

  const featureLabelValue = selectedFeatureProperties[FEATURE_LABEL_KEY];

  const featureTitleColor = (() => {
    const toCssColor = (color: unknown): string | undefined => {
      if (typeof color === 'string') {
        return color;
      }

      if (Array.isArray(color)) {
        return color.length === 4 ? `rgba(${color.join(',')})` : `rgb(${color.join(',')})`;
      }

      return undefined;
    };

    if (selectedExistingFeature) {
      return toCssColor(PPMapStyles.get(FeatureType.EXISTING_PP)?.getStroke()?.getColor());
    }

    if (selectedFeatureProperties?.exceeded === true) {
      return '#d32f2f';
    }

    if (selectedFeatureProperties?._featureType === FeatureType.LOW_RESOLUTION_PP) {
      return toCssColor(PPMapStyles.get(FeatureType.LOW_RESOLUTION_PP)?.getStroke()?.getColor());
    }

    return undefined;
  })();

  return (
    <Box className="featurePropertiesPopup">
      <Box className="featurePropertiesPopupHeader">
        <Typography className="featurePropertiesPopupTitle" tag="span" style={{ color: featureTitleColor }}>
          {featureLabelValue !== undefined && featureLabelValue !== null
            ? formatPropertyValue(featureLabelValue)
            : ''}
        </Typography>
        <IconButton
          className="featurePropertiesPopupClose mc-icon-Close"
          label="CLOSE"
          onClick={onClose}
        />
      </Box>
      <Box className="featurePropertiesPopupRows">
        {Object.entries(selectedFeatureProperties)
          .filter(([key]) => {
            if (key === NO_PROPERTIES_MESSAGE_KEY) {
              return true;
            }
            return key !== FEATURE_LABEL_KEY && !key.startsWith('_');
          })
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
