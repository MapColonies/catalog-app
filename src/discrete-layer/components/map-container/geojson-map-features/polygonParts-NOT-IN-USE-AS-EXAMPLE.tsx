export {};
// import React, { useEffect, useState } from 'react';
// import { useIntl } from 'react-intl';
// import { Feature, GeoJsonProperties, Geometry, LineString, MultiPolygon, Polygon } from 'geojson';
// import { isEmpty } from 'lodash';
// import { observer } from 'mobx-react-lite';
// import { useCesiumMap } from '@map-colonies/react-components';
// import CONFIG from '../../../../common/config';
// import { useEnums } from '../../../../common/hooks/useEnum.hook';
// import useWfsPolygonPartsRequests from '../../../../common/hooks/useWfsPolygonPartsRequests';
// import { crossesMeridian, ZERO_MERIDIAN } from '../../../../common/utils/geo.tools';
// import { LayerRasterRecordModelType, useStore } from '../../../models';
// import useZoomLevelsTable from '../../export-layer/hooks/useZoomLevelsTable';
// import { getWFSFeatureTypeName } from '../../layer-details/raster/pp-map.utils';
// import { GeojsonFeatureWithInfoBox } from './geojson-feature-with-infobox.component';

// export const PolygonParts: React.FC = observer(() => {
//   const store = useStore();
//   const intl = useIntl();
//   const ENUMS = useEnums();
//   const cesiumViewer = useCesiumMap();
//   const ZOOM_LEVELS_TABLE = useZoomLevelsTable();
//   const valuesZoomLevelInDeg = Object.values(ZOOM_LEVELS_TABLE);
//   const { setQueryPolygonPartsFeatureOptions } = useWfsPolygonPartsRequests(); // <- from catalog tree/grid
//   const [zoomLevel, setZoomLevel] = useState(cesiumViewer.currentZoomLevel);
//   const [mapExtent, setMapExtent] = useState(store.discreteLayersStore.mapViewerExtentPolygon);
//   const [activeLayer, setActiveLayer] = useState(store.discreteLayersStore.polygonPartsLayer);
//   const [polygonPartsInfo, setPolygonPartsInfo] = useState(store.discreteLayersStore.polygonPartsInfo);
//   const [showFootprint, setShowFootprint] = useState(false);

//   useEffect(() => {
//     if (JSON.stringify(activeLayer) !== JSON.stringify(store.discreteLayersStore.polygonPartsLayer)) {
//       setActiveLayer(store.discreteLayersStore.polygonPartsLayer);
//       if (store.discreteLayersStore.polygonPartsLayer === undefined) {
//         setShowFootprint(false);
//       }
//     }
//     if (store.discreteLayersStore.polygonPartsLayer && store.discreteLayersStore.mapViewerExtentPolygon) {
//       if (zoomLevel !== cesiumViewer.currentZoomLevel) {
//         setZoomLevel(cesiumViewer.currentZoomLevel);
//       }
//       if (JSON.stringify(mapExtent) !== JSON.stringify(store.discreteLayersStore.mapViewerExtentPolygon)) {
//         setMapExtent(store.discreteLayersStore.mapViewerExtentPolygon);
//       }
//     }
//   }, [store.discreteLayersStore.polygonPartsLayer, store.discreteLayersStore.mapViewerExtentPolygon]);

//   useEffect(() => {
//     if (mapExtent && activeLayer) {
//       if (zoomLevel && zoomLevel > CONFIG.POLYGON_PARTS.MAX.SHOW_FOOTPRINT_ZOOM_LEVEL) {
//         setShowFootprint(false);
//         setQueryPolygonPartsFeatureOptions({
//           feature: {
//             type: 'Feature',
//             properties: {},
//             geometry: mapExtent.geometry
//           },
//           typeName: getWFSFeatureTypeName(activeLayer as LayerRasterRecordModelType, ENUMS),
//           count: CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES,
//           startIndex: 0,
//           dWithin: 0
//         });
//       } else {
//         setShowFootprint(true);
//       }
//     }
//   }, [mapExtent, activeLayer]);

//   useEffect(() => {
//     const updatedPolygonPartsInfo = store.discreteLayersStore.polygonPartsInfo;
//     setPolygonPartsInfo(updatedPolygonPartsInfo);
//   }, [store.discreteLayersStore.polygonPartsInfo]);

//   const enrichWFSData = (geoJsonFeature: Feature) => {
//     const resolutionDegree = geoJsonFeature?.properties?.['resolutionDegree'];
//     if (isNaN(resolutionDegree)) {
//       return;
//     }
//     const indexOfCurrentDeg = valuesZoomLevelInDeg.indexOf(resolutionDegree);
//     if (indexOfCurrentDeg >= 0) {
//       // @ts-ignore
//       geoJsonFeature.properties['resolutionDegree'] = `${resolutionDegree} (${indexOfCurrentDeg})`;
//     }
//   };

//   if (isEmpty(polygonPartsInfo) && !showFootprint) { return null; }

//   return (
//     <>
//       {
//         showFootprint ? (
//           <GeojsonFeatureWithInfoBox
//             feature={{
//               type: 'Feature',
//               properties: {},
//               geometry: {
//                 ...activeLayer?.footprint,
//               },
//             }}
//             featureConfig={CONFIG.CONTEXT_MENUS.MAP.POLYGON_PARTS_FEATURE_CONFIG}
//             isPolylined={false}
//             infoBoxTitle={intl.formatMessage({ id: 'map-context-menu.polygon-parts.title' })}
//             noInfoMessage={intl.formatMessage({ id: 'polygonParts-info.no-data.message' })}
//             markerIconPath={''}
//             shouldFocusOnCreation={false}
//             shouldVisualize={true}
//           />
//         ) : (
//           (polygonPartsInfo as Feature<Geometry, GeoJsonProperties>[]).map((feature) => {
//             const geoJsonFeature = feature as Feature;
//             const isCrossesMeridian = crossesMeridian(geoJsonFeature.geometry as Polygon | MultiPolygon, ZERO_MERIDIAN);
//             enrichWFSData(geoJsonFeature);
//             return (
//               <GeojsonFeatureWithInfoBox
//                 key={geoJsonFeature.id}
//                 feature={geoJsonFeature as Feature<LineString | Polygon>}
//                 featureConfig={CONFIG.CONTEXT_MENUS.MAP.POLYGON_PARTS_FEATURE_CONFIG}
//                 isPolylined={false}
//                 infoBoxTitle={intl.formatMessage({ id: 'map-context-menu.polygon-parts.title' })}
//                 noInfoMessage={intl.formatMessage({ id: 'polygonParts-info.no-data.message' })}
//                 markerIconPath={''}
//                 shouldFocusOnCreation={false}
//                 shouldVisualize={!isCrossesMeridian}
//               />
//             );
//           })
//         )
//       }
//     </>
//   );
// });
