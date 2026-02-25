import { CSSProperties, useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Polygon, MultiPolygon } from 'geojson';
import { isEmpty } from 'lodash';
import center from '@turf/center';
import { AllGeoJSON } from '@turf/helpers';
import {
  CesiumCartesian3,
  CesiumCartographic,
  CesiumColor,
  CesiumEntity,
  CesiumHorizontalOrigin,
  CesiumVerticalOrigin,
} from '@map-colonies/react-components';
import { Typography, useTheme } from '@map-colonies/react-core';
import { useForceEntitySelection } from '../../../../common/hooks/useForceEntitySelection.hook';
import {
  IPosition,
  useHeightFromTerrain,
} from '../../../../common/hooks/useHeightFromTerrain';
import useStaticHTML from '../../../../common/hooks/useStaticHtml';
import {
  crossesMeridian,
  ZERO_MERIDIAN,
} from '../../../../common/utils/geo.tools';
import useZoomLevelsTable from '../../export-layer/hooks/useZoomLevelsTable';
import {
  FEATURE_LABEL_CONFIG,
  getText,
} from '../../layer-details/raster/pp-map.utils';
import { CesiumInfoBoxContainer } from './cesium-infoBox-container';
import {
  GeojsonFeature,
  GeojsonFeatureProps,
} from './geojson-feature.component';
import GenericInfoBoxContainer from './generic-infoBox-container.component';

interface GeojsonFeatureWithInfoBoxProps extends GeojsonFeatureProps {
  noInfoMessage: string;
  infoBoxTitle: string;

  /**
   * Defaults to the `center of the feature`
   */
  markerPosition?: IPosition;

  /**
   * Defaults to `'assets/img/map-marker.gif'`
   */
  markerIconPath?: string;

  /**
   * Defaults to `0.3`
   */
  markerScale?: number;

  /**
   * Whether or not to select the entity after creation to show the infoBox.
   *
   * Defaults to `true`
   */
  shouldFocusOnCreation?: boolean;

  /**
   * Whether or not to visualize the geojson feature on the map
   *
   * Defaults to `false`
   */
  shouldVisualize?: boolean;

  /**
   * A predicate function that receives the feature data and returns whether the data is considered empty.
   *
   * Default behavior - data is considered empty if the `properties` object is empty.
   */
  noDataFoundPredicate?: (data: Record<string, unknown>) => boolean;

  /**
   * Where to present marker if no features?
   */
  fallbackCoordinates?: IPosition;
}

const DEFAULT_MARKER_SCALE = 0.3;
const DEFAULT_MARKER_ICON = 'assets/img/map-marker.gif';
const LONGITUDE_POSITION = 0;
const LATITUDE_POSITION = 1;

export const GeojsonFeatureWithInfoBox: React.FC<
  GeojsonFeatureWithInfoBoxProps
> = (props) => {
  const intl = useIntl();
  const ZOOM_LEVELS_TABLE = useZoomLevelsTable();
  const { setCoordinates, newPositions } = useHeightFromTerrain();
  const themeObj = useTheme();
  const theme = themeObj as Record<string, string>;
  const markerPositionWithHeight = newPositions?.[0] as IPosition;

  const {
    // GeojsonFeature props
    feature,
    isPolylined,
    featureConfig,
    // InfoBox props
    infoBoxTitle,
    noInfoMessage,
    markerScale = DEFAULT_MARKER_SCALE,
    markerIconPath = DEFAULT_MARKER_ICON,
    shouldVisualize = false,
    markerPosition,
    shouldFocusOnCreation,
    noDataFoundPredicate,
    fallbackCoordinates,
  } = props;

  useEffect(() => {
    if (markerPosition) {
      setCoordinates([markerPosition]);
    } else if (!isEmpty(feature.geometry)) {
      const featureCenter = center(feature as AllGeoJSON);
      const centerCartographic: IPosition = {
        longitude: featureCenter.geometry.coordinates[LONGITUDE_POSITION],
        latitude: featureCenter.geometry.coordinates[LATITUDE_POSITION],
      };
      setCoordinates([centerCartographic]);
    } else if (fallbackCoordinates) {
      setCoordinates([fallbackCoordinates]);
    }
  }, [markerPosition, fallbackCoordinates]);

  const FeatureInfoBoxHtml: React.FC = () => {
    const noDataStyle: CSSProperties = {
      width: '100%',
      height: '5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    const hasDataStyle: CSSProperties = {
      width: '100%',
      padding: '0.5rem',
      color: theme.textPrimaryOnDark,
      backgroundColor: theme.gcAlternativeSurface,
    };

    const featureInfo = feature.properties as Record<string, unknown>;
    const featureHasData = noDataFoundPredicate
      ? noDataFoundPredicate(featureInfo)
      : !isEmpty(featureInfo);

    const style = useMemo(
      () => (featureHasData ? hasDataStyle : noDataStyle),
      [featureHasData]
    );

    let content: JSX.Element = <></>;

    if (featureHasData) {
      const isCrossesMeridian = crossesMeridian(
        feature.geometry as Polygon | MultiPolygon,
        ZERO_MERIDIAN
      );
      content = (
        <>
          {isCrossesMeridian && (
            <Typography
              tag="h3"
              style={{
                color: (theme.custom as unknown as Record<string, string>)
                  .GC_WARNING_HIGH,
                textAlign: 'center',
              }}
              dir={intl.locale === 'he' ? 'rtl' : 'ltr'}
            >
              {intl.formatMessage({
                id: 'polygonParts-info.part-to-large.message',
              })}
            </Typography>
          )}
          <table style={style}>
            <tbody>
              {Object.entries(featureInfo).map(([key, val]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{`${val as string}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      );
    } else {
      content = (
        <div style={style}>
          <Typography
            tag="h3"
            style={{ color: theme.textPrimaryOnDark }}
            dir={intl.locale === 'he' ? 'rtl' : 'ltr'}
          >
            {noInfoMessage}
          </Typography>
        </div>
      );
    }

    return (
      <GenericInfoBoxContainer positionInRadians={markerPositionWithHeight}>
        {content}
      </GenericInfoBoxContainer>
    );
  };

  const featureInfoHtml = useStaticHTML<{
    children: React.ReactNode;
    theme: Record<string, string>;
  }>({
    FunctionalComp: CesiumInfoBoxContainer,
    props: {
      children: <FeatureInfoBoxHtml />,
      theme: themeObj,
    },
  });

  const { entitySelected } = useForceEntitySelection([featureInfoHtml]);

  const billboardProps = useMemo(() => {
    return markerIconPath !== ''
      ? {
          verticalOrigin: CesiumVerticalOrigin.BOTTOM,
          scale: markerScale,
          image: markerIconPath,
        }
      : undefined;
  }, [markerIconPath, markerScale]);

  const labelProps = useMemo(() => {
    return markerIconPath === ''
      ? {
          text: getText(
            feature,
            4,
            FEATURE_LABEL_CONFIG.polygons,
            ZOOM_LEVELS_TABLE
          ),
          font: `${FEATURE_LABEL_CONFIG.polygons.size} ${FEATURE_LABEL_CONFIG.polygons.font}`,
          fillColor: featureConfig?.outlineColor
            ? CesiumColor.fromCssColorString(featureConfig.outlineColor)
            : undefined,
          outlineColor: featureConfig?.color
            ? CesiumColor.fromCssColorString(featureConfig.color)
            : undefined,
          outlineWidth: 3,
          verticalOrigin: CesiumVerticalOrigin.CENTER,
          horizontalOrigin: CesiumHorizontalOrigin.CENTER,
        }
      : undefined;
  }, [feature, featureConfig]);

  return (
    <>
      {markerPositionWithHeight && (
        <CesiumEntity
          name={infoBoxTitle}
          position={CesiumCartesian3.fromRadians(
            (markerPositionWithHeight as CesiumCartographic).longitude,
            (markerPositionWithHeight as CesiumCartographic).latitude,
            (markerPositionWithHeight as CesiumCartographic).height
          )}
          billboard={billboardProps}
          label={labelProps}
          description={featureInfoHtml}
          selected={shouldFocusOnCreation ? entitySelected : undefined}
        />
      )}

      {shouldVisualize && !isEmpty(feature) && (
        <GeojsonFeature
          feature={feature}
          isPolylined={isPolylined}
          featureConfig={featureConfig}
        />
      )}
    </>
  );
};
