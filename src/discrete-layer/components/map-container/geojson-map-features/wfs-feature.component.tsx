/* eslint-disable @typescript-eslint/naming-convention */
import React from 'react';
import { observer } from 'mobx-react-lite';
import { Feature, LineString, Polygon } from 'geojson';
import { useIntl } from 'react-intl';
import { useStore } from '../../../models';
import { GeojsonFeatureWithInfoBox } from './geojson-feature-with-infobox.component';

const LONGITUDE_POSITION = 0;
const LATITUDE_POSITION = 1;

export const WfsFeature: React.FC = observer(() => {
  const store = useStore();
  const intl = useIntl();
  const wfsFeature = store.mapMenusManagerStore.currentWfsFeatureInfo;

  if (!wfsFeature) return null;

  // If there are no features, use array with an empty object instead so that `GeojsonFeatureWithInfoBox` component will render no data found message
  const wfsFeatures = wfsFeature.features?.length ? wfsFeature.features : [{}];

  return (
    <>
      {wfsFeatures?.map((feature) => {
        const geoJsonFeature = feature as Feature;

        return (
          <GeojsonFeatureWithInfoBox
            feature={geoJsonFeature as Feature<LineString | Polygon>}
            featureConfig={wfsFeature.config}
            isPolylined={true}
            infoBoxTitle={intl.formatMessage({
              id: wfsFeature.config.translationId ?? wfsFeature.typeName,
            })}
            noInfoMessage={intl
              .formatMessage({ id: 'wfs-info.no-data.message' })
              .replace(
                '{feature}',
                intl.formatMessage({
                  id: wfsFeature.config.translationId ?? wfsFeature.typeName,
                })
              )}
            markerIconPath={
              wfsFeature.config.markerIcon
                ? `assets/img/app/${wfsFeature.config.markerIcon}.png`
                : undefined
            }
            markerPosition={{
              longitude: Number(
                wfsFeature.pointCoordinates[LONGITUDE_POSITION]
              ),
              latitude: Number(wfsFeature.pointCoordinates[LATITUDE_POSITION]),
            }}
            shouldFocusOnCreation={wfsFeatures.length === 1}
            shouldVisualize={wfsFeature.config.isVisualized}
          />
        );
      })}
    </>
  );
});
