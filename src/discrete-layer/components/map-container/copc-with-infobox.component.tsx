import React, { CSSProperties, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  CesiumCartesian3,
  CesiumEntity,
  CesiumHorizontalOrigin,
  CesiumMath,
  CesiumVerticalOrigin,
  CesiumCopcPointCloud,
  ICesiumCopcPointCloud,
} from '@map-colonies/react-components';
import { Typography, useTheme } from '@map-colonies/react-core';
import { getTextDirection } from '../../../common/i18n/helpers';
import { useForceEntitySelection } from '../../../common/hooks/useForceEntitySelection.hook';
import useStaticHTML from '../../../common/hooks/useStaticHtml';
import { CesiumInfoBoxContainer } from './geojson-map-features/cesium-infoBox-container';
import GenericInfoBoxContainer from './geojson-map-features/generic-infoBox-container.component';

export type CopcColorMode = 'fixed' | 'elevation' | 'rgb' | 'intensity' | 'classification';

export interface CopcPickedPoint {
  nodeKey: string;
  pointIndex: number;
  longitude: number;
  latitude: number;
  height: number;
  intensity?: number;
  classification?: number;
  classificationLabel?: string;
  rgb?: { red: number; green: number; blue: number };
}

export interface CopcWithInfoBoxProps extends ICesiumCopcPointCloud {
  infoBoxTitle: string;
  markerIconPath?: string;
  markerScale?: number;
  shouldFocusOnCreation?: boolean;
}

const DEFAULT_MARKER_SCALE = 0.3;
const DEFAULT_MARKER_ICON = 'assets/img/map-marker.gif';

export const CopcWithInfoBox: React.FC<CopcWithInfoBoxProps> = (props) => {
  const intl = useIntl();
  const themeObj = useTheme();
  const theme = themeObj as Record<string, string>;

  const {
    infoBoxTitle,
    markerScale = DEFAULT_MARKER_SCALE,
    markerIconPath = DEFAULT_MARKER_ICON,
    shouldFocusOnCreation = true,
    onPointPicked,
    ...copcProps
  } = props;

  const [pickedPoint, setPickedPoint] = useState<CopcPickedPoint | undefined>(undefined);

  const markerPosition = useMemo(() => {
    return pickedPoint
      ? CesiumCartesian3.fromDegrees(
          pickedPoint.longitude,
          pickedPoint.latitude,
          pickedPoint.height
        )
      : undefined;
  }, [pickedPoint]);

  const PointInfoBoxHtml: React.FC = () => {
    if (!pickedPoint) return <></>;

    const hasDataStyle: CSSProperties = {
      width: '100%',
      padding: '0.5rem',
      color: theme.textPrimaryOnDark,
      backgroundColor: theme.gcAlternativeSurface,
    };

    const pointInfo: Record<string, string> = {
      Longitude: pickedPoint.longitude.toFixed(6),
      Latitude: pickedPoint.latitude.toFixed(6),
      'Height (m)': pickedPoint.height.toFixed(2),
      ...(pickedPoint.classificationLabel !== undefined && {
        Classification: pickedPoint.classificationLabel,
      }),
      ...(pickedPoint.intensity !== undefined && { Intensity: String(pickedPoint.intensity) }),
      ...(pickedPoint.rgb !== undefined && {
        RGB: `${pickedPoint.rgb.red}, ${pickedPoint.rgb.green}, ${pickedPoint.rgb.blue}`,
      }),
    };

    return (
      <GenericInfoBoxContainer
        positionInRadians={{
          longitude: CesiumMath.toRadians(pickedPoint.longitude),
          latitude: CesiumMath.toRadians(pickedPoint.latitude),
        }}
      >
        <Typography
          tag="h4"
          style={{ color: theme.textPrimaryOnDark, textAlign: 'center' }}
          dir={getTextDirection(intl.locale)}
        >
          {infoBoxTitle}
        </Typography>
        <table style={hasDataStyle}>
          <tbody>
            {Object.entries(pointInfo).map(([key, val]) => (
              <tr key={key}>
                <td>{key}</td>
                <td>{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GenericInfoBoxContainer>
    );
  };

  const pointInfoHtml = useStaticHTML<{
    children: React.ReactNode;
    theme: Record<string, string>;
  }>({
    FunctionalComp: CesiumInfoBoxContainer,
    props: {
      children: <PointInfoBoxHtml />,
      theme: themeObj,
    },
  });

  const { entitySelected } = useForceEntitySelection([
    pickedPoint?.nodeKey,
    pickedPoint?.pointIndex,
  ]);

  // The cast bridges the CopcLayerProps shape (see the comment above) to ICesiumCopcPointCloud's
  // degraded type; the props themselves are exactly what CesiumCopcPointCloud/CopcCesiumLayer
  // actually accept at runtime.
  const copcLayerProps = {
    ...copcProps,
    onPointPicked: (point: CopcPickedPoint | undefined): void => {
      setPickedPoint(point);
      //@ts-ignore
      onPointPicked?.(point);
    },
  } as unknown as React.ComponentProps<typeof CesiumCopcPointCloud>;

  return (
    <>
      <CesiumCopcPointCloud {...copcLayerProps} />

      {markerPosition && (
        <CesiumEntity
          name={infoBoxTitle}
          position={markerPosition}
          billboard={{
            verticalOrigin: CesiumVerticalOrigin.BOTTOM,
            horizontalOrigin: CesiumHorizontalOrigin.CENTER,
            scale: markerScale,
            image: markerIconPath,
          }}
          description={pointInfoHtml}
          selected={shouldFocusOnCreation ? entitySelected : undefined}
        />
      )}
    </>
  );
};
