
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Feature, GeoJsonProperties, Geometry, LineString, MultiLineString, Polygon } from 'geojson';
import { observer } from 'mobx-react';
import { Style } from 'ol/style';
import lineStringToPolygon from '@turf/linestring-to-polygon';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import intersect from '@turf/intersect';
import buffer from '@turf/buffer';
import { GeoJSONFeature, useMap, VectorLayer, VectorSource } from '@map-colonies/react-components';
import CONFIG from '../../../../common/config';
import { emphasizeByHTML } from '../../../../common/helpers/formatters';
import { SetWithContentEquality } from '../../../../common/helpers/set';
import { useEnums } from '../../../../common/hooks/useEnum.hook';
import { area } from '../../../../common/utils/geo.tools';
import { GetFeatureModelType, LayerRasterRecordModelType, useQuery, useStore } from '../../../models';
import { IDispatchAction } from '../../../models/actionDispatcherStore';
import { ILayerImage } from '../../../models/layerImage';
import { GeojsonFeatureInput } from '../../../models/RootStore.base';
import { UserAction } from '../../../models/userStore';
import useZoomLevelsTable from '../../export-layer/hooks/useZoomLevelsTable';
import { createTextStyle, FeatureType, FEATURE_LABEL_CONFIG, getWFSFeatureTypeName, PPMapStyles } from './pp-map.utils';

import './pp-polygon-vector-layer.css';

interface PolygonPartsVectorLayerProps {
  layerRecord?: ILayerImage | null;
  maskFeature?: Feature | null;
  partsToCheck?: Feature[];
  ingestionResolutionMeter?: number | null;
}

const START_PAGE = 0;
const EXISTING_PART_BUFFER_METERS_TOLLERANCE = -1;
const MINIMAL_POLYGON_AREA_METERS = 100;

export const PolygonPartsByPolygonVectorLayer: React.FC<PolygonPartsVectorLayerProps> = observer(({layerRecord, maskFeature, partsToCheck, ingestionResolutionMeter}) => {
  const store = useStore();
  const intl = useIntl();
  const mapOl = useMap();
  const [existingPolygonParts, setExistingPolygonParts] = useState<Feature[]>([]);
  const [doneFetchingPP, setDoneFetchingPP] = useState<boolean>(false);
  const [illegalParts, setIllegalParts] = useState<Feature[]>([]);
  const { data, error, loading, setQuery } = useQuery<{ getPolygonPartsFeature: GetFeatureModelType}>();
  const [page, setPage] = useState(START_PAGE);
  const ZOOM_LEVELS_TABLE = useZoomLevelsTable();
  const ENUMS = useEnums();
  const [progress, setProgress] = useState<number | null>(null);

  const convertFeatureToPolygon = (feature: Feature) => {
    switch (feature.geometry.type) {
      case 'LineString':
        return lineStringToPolygon(feature as Feature<LineString | MultiLineString>);
      case 'MultiLineString':
        return bboxPolygon(bbox(feature));
      default:
        return feature;
    }
  }
  
  const showLoadingSpinner = (isShown: boolean) => {
    isShown? 
      mapOl.getTargetElement().classList.add('olSpinner') :
      mapOl.getTargetElement().classList.remove('olSpinner');
  };

  const getExistingPolygoParts = (feature: Feature | null | undefined, startIndex: number) => {
    setQuery(store.queryGetPolygonPartsFeature({ 
      data: {
        feature:  feature as GeojsonFeatureInput,
        typeName: getWFSFeatureTypeName(layerRecord as LayerRasterRecordModelType, ENUMS),
        count: CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES,
        startIndex
      } 
    }));
  };
  
  const dispatchAction = (action: Record<string,unknown>): void => {
    store.actionDispatcherStore.dispatchAction(
      {
        action: action.action,
        data: action.data,
      } as IDispatchAction
      );
    };
    
    useEffect(() => {
      if (maskFeature) {
        showLoadingSpinner(true);
        store.discreteLayersStore.setPPCollisionCheckInProgress(true);
        getExistingPolygoParts(convertFeatureToPolygon(maskFeature), START_PAGE);  
    }
  },[maskFeature]);
  
  useEffect(() => {
    if (!loading && data && maskFeature) {
      setExistingPolygonParts([
        ...(page === 0 ? existingPolygonParts.slice(1) : existingPolygonParts),
        ...data.getPolygonPartsFeature.features as Feature<Geometry, GeoJsonProperties>[]
      ]);
      if (data.getPolygonPartsFeature.numberReturned as number !== 0) {
        getExistingPolygoParts(convertFeatureToPolygon(maskFeature), (page+1) * CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES);
        setPage(page+1);
      } else {
        setDoneFetchingPP(true);
      }
    } 
    if (loading) {
      showLoadingSpinner(true);
    }
  }, [data, loading]);

  useEffect(() => {
    if (!loading && error) {
      showLoadingSpinner(false);
      dispatchAction(
        {
          action: UserAction.SYSTEM_CALLBACK_SHOW_PPERROR_ON_UPDATE,
          data: 
            {
              error: [
                intl.formatMessage(
                  {id: 'validation-general.polygonParts.wfsServerError'}
              )]
            },
        }
      );
    } 
  }, [error, loading]);

  useEffect(() => {
    const interPartsSet = new SetWithContentEquality<Feature>(part => part.properties?.key);  
    if (doneFetchingPP && ingestionResolutionMeter && partsToCheck?.length) {
      let smallPolygonError: boolean = false;

      const check = async () => {
        const totalParts = partsToCheck?.length;
  
        for (let idx = 0; idx < totalParts; idx++) {
          const part = partsToCheck[idx];
          setProgress(idx + 1);
 
          // Force browser to paint
          await new Promise(resolve => setTimeout(resolve, 0));

          // check if map exists against the real DOM (dialog might be closed)
          if (!document.getElementsByClassName('olSpinner').length){
            return;
          }
          let bufferedPart = buffer(part as Feature<Polygon>, EXISTING_PART_BUFFER_METERS_TOLLERANCE, { units: 'meters' });
          // bufferedPart can be UNDEFINED in two cases:
          // 1. SMALL polygon which is collapsed --> might be neglected 
          // 2. NEAR WORLD-WIDE(closed to poles) polyogn due to turf calculations --> must be checked 
          if (!bufferedPart && area(part as Feature<Polygon>) > MINIMAL_POLYGON_AREA_METERS) {
            bufferedPart = part as Feature<Polygon>;
          }

          for(let i = 0; i < existingPolygonParts.length; i++) {
            const existingPart = existingPolygonParts[i];

            try {
              if (bufferedPart) {
                const intersection = intersect(
                  bufferedPart.geometry as Polygon,
                  existingPart.geometry as Polygon
                );
                if (intersection && ingestionResolutionMeter > existingPart.properties?.resolutionMeter) {
                  interPartsSet.add(part);
                }
              }
            } catch (err) {
              console.log('Error WFS intersect accure:', err);
              console.log('Problematic polygon:', existingPart);

              dispatchAction(
                {
                  action: UserAction.SYSTEM_CALLBACK_SHOW_PPERROR_ON_UPDATE,
                  data: 
                  {
                    error: [
                      intl.formatMessage({ id: 'validation-general.polygonParts.wfsExtremelySmall' })]
                  },
                }
              );

              smallPolygonError = true;

              break;
            }
          }
        }
        
        setProgress(null);
        
        setIllegalParts(interPartsSet.values());

        if (!smallPolygonError) { 
          dispatchAction({
            action: UserAction.SYSTEM_CALLBACK_SHOW_PPERROR_ON_UPDATE,
            data: interPartsSet.values().length > 0
            ? {
              error: [
                intl.formatMessage(
                  { id: 'validation-general.polygonParts.resolutionCollision' },
                  { numErrorParts: emphasizeByHTML(`${interPartsSet.values().length}`) }
                )
              ]
            }
            : undefined
          });
        }
  
        store.discreteLayersStore.setPPCollisionCheckInProgress(false);
        showLoadingSpinner(false);
      };
  
      check();
    }
  }, [doneFetchingPP, ingestionResolutionMeter]);


  return (
    <>
    {progress !== null && (
      <div className='chechProgress'>
        {progress} / {partsToCheck?.length}
      </div>
    )}
    <VectorLayer>
      <VectorSource>
        {
          existingPolygonParts.map((feat, idx) => {
            const greenStyle = new Style({
              text: createTextStyle(feat, 4, FEATURE_LABEL_CONFIG.polygons, ZOOM_LEVELS_TABLE),
              stroke: PPMapStyles.get(FeatureType.EXISTING_PP)?.getStroke(),
              fill: PPMapStyles.get(FeatureType.EXISTING_PP)?.getFill(),
            });

            return feat ? <GeoJSONFeature 
              geometry={{...feat.geometry}} 
              fit={false}
              featureStyle={greenStyle}
            /> : <></>
          })
        }
        {illegalParts.map((feat, idx) => {
            const illegalStyle = new Style({
              stroke: PPMapStyles.get(FeatureType.ILLEGAL_PP)?.getStroke(),
              fill: PPMapStyles.get(FeatureType.ILLEGAL_PP)?.getFill(),
            });

            return feat ? <GeoJSONFeature 
              geometry={{...feat.geometry}} 
              fit={false}
              featureStyle={illegalStyle}
            /> : <></>
          }
        )}
      </VectorSource>
    </VectorLayer>
    </>
  );
});