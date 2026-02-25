import { useEffect, useState } from 'react';
import { Feature, LineString, Polygon } from 'geojson';
import { observer } from 'mobx-react-lite';
import { useIntl } from 'react-intl';
import { IPosition } from '../../../../common/hooks/useHeightFromTerrain';
import { useStore } from '../../../models';
import { GeojsonFeatureWithInfoBox } from './geojson-feature-with-infobox.component';

const DemHeightsFeatureComponent: React.FC = observer(() => {
  const store = useStore();
  const intl = useIntl();

  const currentPositionDemHeight =
    store.mapMenusManagerStore.currentPositionDemHeight;
  const lastMenuPosition = store.mapMenusManagerStore.lastMenuCoordinate;

  const [coordinatesToQuery, setCoordinatesToQuery] = useState<IPosition>();

  useEffect(() => {
    if (lastMenuPosition) {
      setCoordinatesToQuery(lastMenuPosition);
    }
  }, [currentPositionDemHeight]);

  if (!currentPositionDemHeight) return null;

  // Dem heights is not returning a real geojson feature, here is a mock feature so we could use the 'GeojsonFeatureWithInfoBox' component
  const demHeightFeature: Feature<LineString | Polygon> = {
    type: 'Feature',
    geometry: {} as Polygon,
    properties: currentPositionDemHeight,
  };

  return (
    <GeojsonFeatureWithInfoBox
      feature={demHeightFeature}
      infoBoxTitle={intl.formatMessage({
        id: 'map-context-menu.query-dem-height.title',
      })}
      noInfoMessage={intl.formatMessage({
        id: 'dem-heights-info.no-data.message',
      })}
      markerIconPath="assets/img/app/dem-height-marker.png"
      markerPosition={coordinatesToQuery}
      shouldFocusOnCreation
      noDataFoundPredicate={(featureProperties) =>
        Boolean(
          featureProperties?.longitude &&
            featureProperties?.latitude &&
            featureProperties?.height !== null
        )
      }
    />
  );
});

export default DemHeightsFeatureComponent;
