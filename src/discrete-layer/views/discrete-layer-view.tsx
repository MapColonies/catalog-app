/* eslint-disable @typescript-eslint/ban-ts-comment */
import { MapMode2D } from 'cesium';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { find, get, isEmpty } from 'lodash';
import { observer } from 'mobx-react-lite';
import { Geometry, Feature, FeatureCollection, Polygon, Point } from 'geojson';
import { lineString } from '@turf/helpers';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import { 
  Avatar,
  Icon,
  IconButton,
  MenuSurface,
  MenuSurfaceAnchor,
  Select,
  Tooltip,
  Typography,
  useTheme
} from '@map-colonies/react-core';
import {
  BboxCorner,
  Box,
  CesiumColor,
  CesiumDrawingsDataSource,
  CesiumMap,
  CesiumPolylineDashMaterialProperty,
  CesiumRectangle,
  CesiumSceneMode,
  DrawType,
  IContextMenuData,
  IDrawing,
  IDrawingEvent
} from '@map-colonies/react-components';
import { GeocoderOptions } from '@map-colonies/react-components/dist/cesium-map/geocoder/geocoder-panel';
import { IMapLegend } from '@map-colonies/react-components/dist/cesium-map/legend';
// import { BrowserCompatibilityChecker } from '../../common/components/browser-compatibility-checker/browser-compatibility-checker';
import GPUInsufficiencyDetector from '../../common/components/gpu-insufficiency-detector/gpu-insufficiency-detector';
import CONFIG from '../../common/config';
import { currentSite } from '../../common/helpers/siteUrl';
import { localStore } from '../../common/helpers/storage';
import { MenuDimensions } from '../../common/hooks/mapMenus/useGetMenuDimensions';
import { LinkType } from '../../common/models/link-type.enum';
import { Mode } from '../../common/models/mode.enum';
import { ActiveLayersIcon } from '../../icons/4font/ActiveLayers';
import { SelectedLayersContainer } from '../components/map-container/selected-layers-container';
import { HighlightedLayer } from '../components/map-container/highlighted-layer';
import { LayersFootprints } from '../components/map-container/layers-footprints';
import { PolygonSelectionUi } from '../components/map-container/polygon-selection-ui_2';
// import { Filters } from '../components/filters/filters';
import { CatalogTreeComponent } from '../components/catalog-tree/catalog-tree';
import { LayersResults } from '../components/layers-results/layers-results';
import { EntityDialog } from '../components/layer-details/entity.dialog';
import { JobsDialog } from '../components/job-manager/jobs.dialog';
import {
  JobModelType,
  LayerMetadataMixedUnion,
  LinkModelType,
  RecordType
} from '../models';
import { ILayerImage } from '../models/layerImage';
import { useQuery, useStore } from '../models/RootStore';
import { FilterField } from '../models/RootStore.base';
import { UserAction, UserRole } from '../models/userStore';
import { BBoxCorners } from '../components/map-container/bbox.dialog';
import { FlyTo } from '../components/map-container/fly-to';
import { IPOI } from '../components/map-container/poi.dialog';
import { PoiEntity } from '../components/map-container/poi-entity';
import { Terrain } from '../components/map-container/terrain';
import ActionsMenuDimensionsContext from '../components/map-container/contextMenus/contexts/actionsMenuDimensionsContext';
import { SystemCoreInfoDialog } from '../components/system-status/system-core-info/system-core-info.dialog';
import { IDispatchAction } from '../models/actionDispatcherStore';
import { ExportLayerComponent } from '../components/export-layer/export-layer.component';
import ExportDrawingHandler from '../components/export-layer/export-drawing-handler.component';
import ExportPolygonsRenderer from '../components/export-layer/export-polygons-renderer.component';
import { EntityRasterDialog } from '../components/layer-details/raster/entity.raster.dialog';
import { EntityDeleteDialog } from '../components/layer-details/entity.delete-dialog';
import { MapActionResolver } from './components/map-action-resolver.component';
import { ActionsContextMenu } from '../components/map-container/contextMenus/actions.context-menu';
import { ExtentUpdater } from '../components/map-container/extent-updater';
import DemHeightsFeatureComponent from '../components/map-container/geojson-map-features/dem-heights-feature.component';
import { PolygonParts } from '../components/map-container/geojson-map-features/polygonParts';
import { PolygonPartsFeature } from '../components/map-container/geojson-map-features/polygonParts-feature.component';
import { WfsFeature } from '../components/map-container/geojson-map-features/wfs-feature.component';
import { ActionResolver } from './components/action-resolver.component';
import AppTitle from './components/app-title/app-title.component';
import { DetailsPanel } from './components/details-panel.component';
import { TabViewsSwitcher } from './components/tabs-views-switcher.component';
import UserModeSwitch from './components/user-mode-switch/user-mode-switch.component';
import { TabViews } from './tab-views';

import '@material/tab-bar/dist/mdc.tab-bar.css';
import '@material/tab/dist/mdc.tab.css';
import '@material/tab-scroller/dist/mdc.tab-scroller.css';
import '@material/tab-indicator/dist/mdc.tab-indicator.css';

import './discrete-layer-view.css';

const EXPANDED_PANEL_WIDTH = '28%';
const COLLAPSED_PANEL_WIDTH = '40px';
const SIDE_PANEL_WIDTH_VARIABLE = '--side-panel-width';
const START_IDX = 0;
const DELTA = 0.00001;
const DRAWING_MATERIAL_OPACITY = 0.5;
const DRAWING_FINAL_MATERIAL_OPACITY = 0.8;
const DRAWING_MATERIAL_COLOR = CesiumColor.YELLOW.withAlpha(DRAWING_MATERIAL_OPACITY);
const mapMode2D = MapMode2D[CONFIG.MAP.MAPMODE2D as keyof typeof MapMode2D];

const DRAWING_FINAL_MATERIAL = new CesiumPolylineDashMaterialProperty({
  color: CesiumColor.DARKSLATEGRAY.withAlpha(DRAWING_FINAL_MATERIAL_OPACITY), //new CesiumColor( 116, 135, 136, 1),
  dashLength: 10,
});

interface IDrawingObject {
  type: DrawType;
  handler: (drawing: IDrawingEvent) => void;
}

const noDrawing: IDrawingObject = {
  type: DrawType.UNKNOWN,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  handler: (drawing: IDrawingEvent) => {},
};

const getTimeStamp = (): string => new Date().getTime().toString();

const DiscreteLayerView: React.FC = observer(() => {
  // eslint-disable-next-line
  const { loading: searchLoading, error: searchError, data, query, setQuery } = useQuery();
  const store = useStore();
  const theme = useTheme();
  const intl = useIntl();
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [jobToOpenRasterEntity, setJobToOpenRasterEntity] = useState<JobModelType | undefined>(undefined);
  const [jobToOpenJobManager, setJobToOpenJobManager] = useState<JobModelType | undefined>(undefined);
  const [isRasterEntityDialogOpen, setIsRasterEntityDialogOpen] = useState<boolean>(false);
  const [is3DEntityDialogOpen, setIs3DEntityDialogOpen] = useState<boolean>(false);
  const [isDemEntityDialogOpen, setIsDemEntityDialogOpen] = useState<boolean>(false);
  const [isEntityDialogOpen, setEntityDialogOpen] = useState<boolean>(false);
  const [isEntityDeleteDialogOpen, setIsEntityDeleteDialogOpen] = useState<boolean>(false);
  const [isSystemsJobsDialogOpen, setSystemsJobsDialogOpen] = useState<boolean>(false);
  const [isSystemCoreInfoDialogOpen, setSystemCoreInfoDialogOpen] = useState<boolean>(false);
  const [isOpenNewMenu, setIsOpenNewMenu] = useState<boolean>(false);
  const [tabsPanelExpanded, setTabsPanelExpanded] = useState<boolean>(true);
  const [detailsPanelExpanded, setDetailsPanelExpanded] = useState<boolean>(false);
  const [activeTabView, setActiveTabView] = useState(TabViews.CATALOG);
  const [drawPrimitive, setDrawPrimitive] = useState<IDrawingObject>(noDrawing);
  const [catalogRefresh, setCatalogRefresh] = useState<number>(START_IDX);
  const [isActiveLayersFilterEnabled, setIsActiveLayersFilterEnabled] = useState<boolean>(false);
  const [catalogFilter, setCatalogFilter] = useState<boolean>(false);
  const [rect, setRect] = useState<CesiumRectangle | undefined>(undefined);
  const [poi, setPoi] = useState<IPOI | undefined>(undefined);
  const [isPoiSearchActive, setIsPoiSearchActive] = useState(false);
  const [corners, setCorners] = useState<BBoxCorners | undefined>(undefined);
  const [userRole, setUserRole] = useState<UserRole>(store.userStore.user?.role ?? CONFIG.DEFAULT_USER.ROLE);
  const [drawEntities, setDrawEntities] = useState<IDrawing[]>([{
    coordinates: [],
    name: '',
    id: '',
    type: DrawType.UNKNOWN,
  }]);
  const [searchResultsError, setSearchResultsError] = useState();
  const [actionsMenuDimensions, setActionsMenuDimensions] = useState<MenuDimensions>();
  const [whatsNewVisitedCnt, setWhatsNewVisitedCnt] = useState<number>(0);

  const isDrawingState = isDrawing || store.exportStore.drawingState?.drawing;
  const disableOnDrawingClassName = isDrawingState ? 'interactionsDisabled' : ''; 

  useEffect(() => {
    const val = localStore.get('whatsNewVisitedCnt');
    if (val) {
      setWhatsNewVisitedCnt(parseInt(val));
    }
  }, []);

  useEffect(() => {
    const layers = get(data, 'search', []) as ILayerImage[];

    if (activeTabView === TabViews.SEARCH_RESULTS) {
      store.discreteLayersStore.setLayersImages([...layers], false);
    } else {
      store.discreteLayersStore.setTabviewData(TabViews.SEARCH_RESULTS, layers);
    }
  }, [data]);
  
  useEffect(() => {
    // When search query changes, we need to refetch catalog capabilities as well.
    let fullCatalogLayers: LayerMetadataMixedUnion[] | undefined;
    
    // Tab data is set only when switching tabs.
    if (activeTabView === TabViews.CATALOG) {
      fullCatalogLayers = store.discreteLayersStore.layersImages;
    } else {
      fullCatalogLayers = store.discreteLayersStore.tabViews?.[TabViews.CATALOG].layersImages;
    }

    if (!isEmpty(data) && !isEmpty(fullCatalogLayers)) {
      const searchLayers = get(data, 'search', []) as ILayerImage[];
      
      /**
       * There could be a case where the catalog includes outdated data (New layers has bee added).
       * Search results will always be updated each time new filter is applied.
       * As a workaround we add the delta layers to the capabilities search to update the capabilities state with the added layers.
       */
      searchLayers.forEach(layer => {
        const isNewLayer = !fullCatalogLayers?.some(catalogLayer => catalogLayer.id === layer.id);
        if (isNewLayer) {
          fullCatalogLayers?.push(layer);
        }
      })
    }
    
    void store.catalogTreeStore.capabilitiesFetch(fullCatalogLayers);
  }, [data]);

  useEffect(() => {
    setSearchResultsError(searchError);
  }, [searchError]);
  
  useEffect(() => {
    /**
     * Instead of just set the width of the panel according to the state, we need to assign variable on the app container
     * because the map container will need to resize accordingly to fill up the space.
     * */ 
    const appContainer = document.querySelector('.app-container') as HTMLDivElement;
    if (!tabsPanelExpanded) {
      appContainer?.style.setProperty(SIDE_PANEL_WIDTH_VARIABLE, COLLAPSED_PANEL_WIDTH);
    } else {
      appContainer?.style.setProperty(SIDE_PANEL_WIDTH_VARIABLE, EXPANDED_PANEL_WIDTH);
    }
  }, [tabsPanelExpanded]);

  useEffect(() => {
    store.discreteLayersStore.resetTabView([TabViews.SEARCH_RESULTS]);
    
    if (activeTabView === TabViews.SEARCH_RESULTS) {
      store.discreteLayersStore.clearLayersImages();
      store.discreteLayersStore.resetSelectedLayer();
      store.discreteLayersStore.resetPolygonParts();
    }

    if (!isPoiSearchActive) {
      setPoi(undefined);
    }
  }, [store.discreteLayersStore.searchParams.geojson]);

  const dispatchAction = (action: Record<string,unknown>): void => {
    store.actionDispatcherStore.dispatchAction(
      {
        action: action.action,
        data: action.data,
      } as IDispatchAction
    );
  };
  
  /* eslint-disable */
  const mapSettingsLocale = useMemo(() => ({
    DIRECTION: intl.locale === 'he' ? 'rtl' : 'ltr',
    METERS_UNIT: intl.formatMessage({ id: 'map.scale.units.meters' }),
    KILOMETERS_UNIT: intl.formatMessage({ id: 'map.scale.units.kilometers' }),
    ZOOM_LABEL: intl.formatMessage({ id: 'map.zoom.label' }),
    DEBUG_PANEL_TITLE: intl.formatMessage({ id: 'debug-panel.title' }),
    WFS_TITLE: intl.formatMessage({ id: 'debug-panel.wfs.title' }),
    WFS_CACHE: intl.formatMessage({ id: 'debug-panel.wfs.cache' }),
    WFS_EXTENT: intl.formatMessage({ id: 'debug-panel.wfs.extent' }),
    NO_DATA_LAYERS: intl.formatMessage({ id: 'debug-panel.empty' }),
    ACTIVE_LAYERS_TITLE: intl.formatMessage({ id: 'active-layers.title' }),
    IMAGERY: intl.formatMessage({ id: 'active-layers.imagery' }),
    DATA: intl.formatMessage({ id: 'active-layers.data' }),
    FLY_TO: intl.formatMessage({ id: 'action.flyTo.tooltip' }),
    REMOVE: intl.formatMessage({ id: 'active-layers.remove' }),
    BASE_MAP_TITLE: intl.formatMessage({ id: 'map-settings.base-map.title' }),
    TERRAIN_TITLE: intl.formatMessage({ id: 'record-type.record_quantized_mesh.label' }),
    SHOW_FEATURE_ON_MAP: intl.formatMessage({ id: 'geocoder-panel.show-feature-on-map' }),
    IN_MAP_EXTENT: intl.formatMessage({ id: 'geocoder-panel.in-map-extent' }),
    SEARCH_PLACEHOLDER: intl.formatMessage({ id: 'general.search.placeholder' }),
    NO_RESULTS: intl.formatMessage({ id: 'results.nodata' }),
  }), [intl]);
  /* eslint-enable */

  const memoizedLayers = useMemo(() => {
    return(
      <>
        <MapActionResolver />
        <SelectedLayersContainer />
        <HighlightedLayer />
        <LayersFootprints />
        <PolygonParts />
      </>
    );
  }, []);

  const handleTabViewChange = (targetViewIdx: TabViews): void => {
    if (activeTabView !== targetViewIdx) {
      store.discreteLayersStore.setTabviewData(activeTabView);
      store.discreteLayersStore.restoreTabviewData(targetViewIdx);
      if (activeTabView === TabViews.EXPORT_LAYER) {
        store.exportStore.setHasExportPreviewed(false);
      }
      setActiveTabView(targetViewIdx);
    }
  };

  const buildFilters = (): FilterField[] => {
    const coordinates = (store.discreteLayersStore.searchParams.geojson as Polygon)?.coordinates[0];
   
    const boundingBoxFilter = coordinates ? [{
      field: 'mc:boundingBox',
      bbox: {
        llon: coordinates[0][0],
        llat: coordinates[0][1],
        ulon: coordinates[2][0],
        ulat: coordinates[2][1],
      },
    }] : [];

    return [
      ...boundingBoxFilter,
      {
        field: 'mc:type',
        eq: store.discreteLayersStore.searchParams.recordType,
      },
      ...store.discreteLayersStore.searchParams.catalogFilters
    ];
  };

  useEffect(() => {
    store.discreteLayersStore.resetSelectedLayer();
    store.discreteLayersStore.resetPolygonParts();
  }, [store.discreteLayersStore.searchParams.recordType]);

  useEffect(() => {
    if (activeTabView === TabViews.SEARCH_RESULTS) {
      void store.discreteLayersStore.clearLayersImages();
  
      // TODO: build query params: FILTERS and SORTS
      const filters = buildFilters();
      setQuery(store.querySearch({
        opts: {
          filter: filters
        },
        end: CONFIG.RUNNING_MODE.END_RECORD,
        start: CONFIG.RUNNING_MODE.START_RECORD,
      }));
    }
  }, [store.discreteLayersStore.searchParams.geojson, store.discreteLayersStore.searchParams.catalogFilters]);

  useEffect(() => {
    const hasFiltersEnabled = store.discreteLayersStore.searchParams.catalogFilters.length > 0 || store.discreteLayersStore.searchParams.geojson;
    if (hasFiltersEnabled) {
      const filters = buildFilters();
      setQuery(store.querySearch({
        opts: {
          filter: filters
        },
        end: CONFIG.RUNNING_MODE.END_RECORD,
        start: CONFIG.RUNNING_MODE.START_RECORD,
      }));
    }
  }, [store.discreteLayersStore.searchParams.recordType]);

  const handlePolygonSelected = (geometry: Geometry): void => {
    store.discreteLayersStore.searchParams.setLocation(geometry);
  };

  const handleCatalogFiltersApply = (filters: FilterField[]): void => {
    if (activeTabView !== TabViews.SEARCH_RESULTS) {
      handleTabViewChange(TabViews.SEARCH_RESULTS);
    }
    store.discreteLayersStore.resetSelectedLayer();
    store.discreteLayersStore.resetPolygonParts();
    store.discreteLayersStore.searchParams.setCatalogFilters(filters);
  };

  const handleCatalogFiltersReset = (): void => {
    if (store.discreteLayersStore.searchParams.catalogFilters.length === 0) return;

    store.discreteLayersStore.searchParams.resetCatalogFilters();

    store.discreteLayersStore.resetTabView([TabViews.SEARCH_RESULTS]);

    if (activeTabView === TabViews.SEARCH_RESULTS) {
      void store.discreteLayersStore.clearLayersImages();
      store.discreteLayersStore.resetSelectedLayer();
      store.discreteLayersStore.resetPolygonParts();
    }
    
    // Geographic filters are being cleaned via the "Trashcan" (handlePolygonReset function).
    // If any of the geographical filters is enabled, then we want to stay at the search results tab.
    
    if (typeof store.discreteLayersStore.searchParams.geojson === 'undefined') {
      handleTabViewChange(TabViews.CATALOG);
      setSearchResultsError(undefined);
    }
  };

  const handlePolygonReset = (): void => {
      store.discreteLayersStore.searchParams.resetLocation();
      setDrawEntities([]);
      setPoi(undefined);
      setCorners(undefined);
      setSearchResultsError(undefined);

    if (activeTabView !== TabViews.CATALOG) {
      // Catalog filters are being cleaned from inside the catalog filters panel.
      // If there's any filter enabled, then we want to stay at the search results tab.
      if (store.discreteLayersStore.searchParams.catalogFilters?.length === 0) {
        handleTabViewChange(TabViews.CATALOG);
      }
    }
    
    store.mapMenusManagerStore.resetMapMenusFeatures();
  };

  useEffect(() => {
    if (activeTabView !== TabViews.CATALOG) {
      handlePolygonReset();
      setActiveTabView(TabViews.CATALOG);
    }
    store.exportStore.reset();
    store.discreteLayersStore.resetTabView();
  }, [userRole]);

  const openEntityByMode = (recordType: RecordType, open: boolean) => {
    const { selectedLayerOperationMode } = store.discreteLayersStore;

    if (recordType === RecordType.RECORD_RASTER) {
      switch (selectedLayerOperationMode) {
        case Mode.NEW:
        case Mode.UPDATE:
          setIsRasterEntityDialogOpen(open);
          break;
        case Mode.EDIT:
        case Mode.VIEW:
          setEntityDialogOpen(open);
          break;
        default:
          break;
      }
    } else if (recordType === RecordType.RECORD_3D) {
      switch (selectedLayerOperationMode) {
        case Mode.NEW:
          setIs3DEntityDialogOpen(open);
          break;
        case Mode.EDIT:
        case Mode.VIEW:
          setEntityDialogOpen(open);
          break;
        case Mode.DELETE:
          setIsEntityDeleteDialogOpen(open);
          break;
        default:
          break;
      }
    } else if (recordType === RecordType.RECORD_DEM) {
      switch (selectedLayerOperationMode) {
        case Mode.NEW:
          setEntityDialogOpen(open);
          break;
        default:
          break
      }
    }
  };

  const handleSystemsJobsDialogClick = (): void => {
    setSystemsJobsDialogOpen(!isSystemsJobsDialogOpen);
  };
  
  const handleSystemsCoreInfoDialogClick = (): void => {
    setSystemCoreInfoDialogOpen(!isSystemCoreInfoDialogOpen);
  };

  const createDrawPrimitive = (type: DrawType): IDrawingObject => {
    return {
      type: type,
      handler: (drawing: IDrawingEvent): void => {
        const timeStamp = getTimeStamp();
        handleTabViewChange(TabViews.SEARCH_RESULTS);
        handlePolygonSelected((drawing.geojson as Feature).geometry as Polygon);
        setIsDrawing(false);
        
        setDrawEntities([
          {
            coordinates: drawing.primitive,
            name: `${type.toString()}_${timeStamp}`,
            id: timeStamp,
            type: drawing.type,
          },
        ]);

        setCorners(undefined);
        setPoi(undefined);
      },
    };
  };
  
  const setDrawType = (drawType: DrawType): void => {
    setIsDrawing(true);
    setDrawPrimitive(createDrawPrimitive(drawType));
  };

  const onPoiSelection = (lon: number, lat: number): void => {
    onPolygonSelection({
      primitive: undefined,
      type: DrawType.BOX,
      geojson: {
        type : 'FeatureCollection',
        features: [
          { 
            type : 'Feature',
            properties : {  
              type : BboxCorner.TOP_RIGHT,
            }, 
            geometry : { 
              type : 'Point',
              coordinates : [ lon + DELTA, lat + DELTA ] 
            }
          },
          { 
            type : 'Feature',
            properties : {  
              type : BboxCorner.BOTTOM_LEFT
            }, 
            geometry : { 
              type : 'Point',
              coordinates : [ lon - DELTA, lat - DELTA ]  
            }
          }
        ]
      }
    }, true);
    setPoi({lon, lat});
  };

  const onPolygonSelection = (polygon: IDrawingEvent, isPoi = false): void => {
    const timeStamp = getTimeStamp();
    const bottomLeftPoint = find((polygon.geojson as FeatureCollection<Point>).features, (feat: Feature<Point>)=>{
      return feat.properties?.type === BboxCorner.BOTTOM_LEFT;
    }) as Feature<Point>;
    const rightTopPoint = find((polygon.geojson as FeatureCollection<Point>).features, (feat: Feature<Point>)=>{
      return feat.properties?.type === BboxCorner.TOP_RIGHT;
    }) as Feature<Point>;
    setCorners({
      topRightLat: rightTopPoint.geometry.coordinates[1],
      topRightLon: rightTopPoint.geometry.coordinates[0],
      bottomLeftLat: bottomLeftPoint.geometry.coordinates[1],
      bottomLeftLon: bottomLeftPoint.geometry.coordinates[0],
    });
    const line = lineString([
      [
        bottomLeftPoint.geometry.coordinates[0],
        bottomLeftPoint.geometry.coordinates[1]
      ],
      [
        rightTopPoint.geometry.coordinates[0],
        rightTopPoint.geometry.coordinates[1],
      ],
    ]);
    const boxPolygon = bboxPolygon(bbox(line));
    
    handleTabViewChange(TabViews.SEARCH_RESULTS);

    handlePolygonSelected((boxPolygon as Feature).geometry as Polygon); 

    setDrawEntities([
      {
        coordinates: polygon.primitive,
        name: `${DrawType.BOX.toString()}_${timeStamp}`,
        id: timeStamp,
        type: DrawType.BOX,
        geojson: polygon.geojson,
      },
    ]);

    setIsPoiSearchActive(isPoi);
  };

  const onFlyTo = useCallback((): void => {
    setRect(new CesiumRectangle());
    dispatchAction({
      action: UserAction.SYSTEM_CALLBACK_FLYTO,
      data: { selectedLayer: store.discreteLayersStore.selectedLayer }
    });
  }, []);

  const handleCloseDialog = useCallback(() => {
    store.discreteLayersStore.setSelectedLayerOperationMode(undefined);
  }, [store.discreteLayersStore.setSelectedLayerOperationMode]);

  const tabViews = [
    {
      idx: TabViews.CATALOG,
      title: 'tab-views.catalog',
      iconClassName: 'mc-icon-Catalog',
    },
    {
      idx: TabViews.SEARCH_RESULTS,
      title: 'tab-views.search-results',
      iconClassName: 'mc-icon-Search-History',
    },
    {
      idx: TabViews.EXPORT_LAYER,
      title: 'tab-views.export-layer',
      iconClassName: intl.locale === 'en' ? 'mc-icon-Export' : 'mc-icon-Export-Left',
    }
  ];

  const permissions = useMemo(() => {
    return {
      isSystemJobsAllowed: store.userStore.isActionAllowed(UserAction.SYSTEM_ACTION_JOBS),
      isSystemCoreInfoAllowed: store.userStore.isActionAllowed(UserAction.SYSTEM_ACTION_COREINFO),
      isWebToolsAllowed: store.userStore.isActionAllowed(UserAction.SYSTEM_ACTION_TOOLS),
      isSystemFilterEnabled: store.userStore.isActionAllowed(UserAction.SYSTEM_ACTION_FILTER),
      isSystemSidebarCollapseEnabled: store.userStore.isActionAllowed(UserAction.SYSTEM_ACTION_SIDEBARCOLLAPSEEXPAND),
      isLayerRasterRecordIngestAllowed: store.userStore.isActionAllowed(UserAction.ENTITY_ACTION_LAYERRASTERRECORD_CREATE),
      isLayer3DRecordIngestAllowed: store.userStore.isActionAllowed(UserAction.ENTITY_ACTION_LAYER3DRECORD_CREATE),
      isLayerDemRecordIngestAllowed: store.userStore.isActionAllowed(UserAction.ENTITY_ACTION_LAYERDEMRECORD_CREATE),
      isSwitchUserRoleAllowed: store.userStore.isActionAllowed(UserAction.FEATURE_SWITCH_USER_ROLE),
      isDeleteAllowed: store.userStore.isActionAllowed(`entity_action.${store.discreteLayersStore.selectedLayer?.__typename}.delete`),
    }
  }, [store.userStore.user, store.discreteLayersStore.selectedLayer]);

  const recordTypeOptions = useMemo(() => {
    return CONFIG.SERVED_ENTITY_TYPES.map((entity) => {
      const value = entity as keyof typeof RecordType;
      return {
        label: intl.formatMessage({id: `record-type.${RecordType[value].toLowerCase()}.label`}),
        value: RecordType[value]
      };
    });
  }, []);

  const PanelExpanderButton: React.FC = () => {
    const isRtl = intl.locale === 'he';
    const iconClassExpand = isRtl ? 'mc-icon-Arrows-Left' : 'mc-icon-Arrows-Right';
    const iconClassCollapse = isRtl ? 'mc-icon-Arrows-Right' : 'mc-icon-Arrows-Left';
    const className = `${tabsPanelExpanded ? iconClassCollapse : iconClassExpand}`;

    return (
      <Tooltip content={intl.formatMessage({ id: `${!tabsPanelExpanded ? 'action.expand.tooltip' : 'action.collapse.tooltip'}` })}>
        <IconButton 
          className={className}
          label="PANEL EXPANDER"
          disabled={!(permissions.isSystemSidebarCollapseEnabled as boolean)}
          onClick={ (): void => {setTabsPanelExpanded(!tabsPanelExpanded);}}
        />
      </Tooltip>
    );
  };

  const getActiveTabHeader = (tabIdx: number, site: string): JSX.Element => {

    if (!tabsPanelExpanded) {
      return (
        <div className="tabHeaderContainer">
           <PanelExpanderButton />
        </div>
      );
    }

    const tabView = find(tabViews, (tab) => {
      return tab.idx === tabIdx;
    });


    return (
      <div className="tabHeaderContainer">
        <div className="tabTitleContainer" style={{backgroundColor: theme.custom?.GC_TAB_ACTIVE_BACKGROUND as string}}>
          <div className="tabTitle" style={{
            backgroundColor: theme.custom?.GC_ALTERNATIVE_SURFACE as string,
            borderBottomColor: theme.custom?.GC_TAB_ACTIVE_BACKGROUND as string
          }}>
            <IconButton 
              className={`operationIcon ${tabView?.iconClassName as string}`}
              label="TAB ICON"
            />
            <div className='tab-title'>
              <Typography use="headline6" tag="span">
                <FormattedMessage id={tabView?.title}></FormattedMessage>
              </Typography>
              <Typography use="headline6" tag="span" className={`current-client-site-${site}`}>
                {site!=='generic' && intl.formatMessage({ id: `tab-views.catalog.site.${site}` })}
              </Typography>
            </div>
          </div>
        </div>

        <div className="tabOperationsContainer" style={{backgroundColor: theme.custom?.GC_ALTERNATIVE_SURFACE as string}}>
          <div className="tabOperations" style={{
            backgroundColor: theme.custom?.GC_TAB_ACTIVE_BACKGROUND as string,
            borderTopColor: theme.custom?.GC_TAB_ACTIVE_BACKGROUND as string
          }}>
            {
              tabIdx === TabViews.CATALOG && 
              <Box className="filterByCatalogEntitySelect">
                <Select
                  enhanced
                  defaultValue={recordTypeOptions[0].value}
                  options={recordTypeOptions}
                  value={store.discreteLayersStore.searchParams.recordType}
                  onChange={
                    (evt: React.ChangeEvent<HTMLSelectElement>): void => {
                      store.discreteLayersStore.searchParams.setRecordType(get(evt,'currentTarget.value'));
                      setCatalogFilter(false);
                      setIsActiveLayersFilterEnabled(false);
                      setCatalogRefresh(catalogRefresh + 1);
                    }
                  }
                />
              </Box>
            }
            {
              tabIdx === TabViews.CATALOG &&
              <Tooltip content={intl.formatMessage({ id: catalogFilter ? 'action.show-all.tooltip' : 'action.filter-nonactive.tooltip' })}>
                <Icon
                  className="operationIcon"
                  disabled={!isActiveLayersFilterEnabled}
                  label="ACTIVE"
                  onClick={(): void => {
                    if (isActiveLayersFilterEnabled) {
                      setCatalogFilter(prev => !prev);
                    }
                  }}
                  icon={
                    <ActiveLayersIcon
                      isFiltered={catalogFilter}
                      color={{
                        active: theme.primary,
                        inactive: theme.textIconOnBackground,
                      }}
                    />
                  }
                />
              </Tooltip>
            }
            {
              tabIdx === TabViews.CATALOG && 
              <Tooltip content={intl.formatMessage({ id: 'action.refresh.tooltip' })}>
                <IconButton
                  className="operationIcon mc-icon-Refresh"
                  onClick={(): void => {
                    setCatalogFilter(false);
                    setIsActiveLayersFilterEnabled(false);
                    setCatalogRefresh(catalogRefresh + 1);
                  }}
                />
              </Tooltip>
            }
            {
              tabIdx === TabViews.CATALOG && 
              (permissions.isLayerRasterRecordIngestAllowed as boolean || permissions.isLayer3DRecordIngestAllowed || permissions.isLayerDemRecordIngestAllowed) && 
              <MenuSurfaceAnchor id="newContainer">
                <MenuSurface open={isOpenNewMenu} onClose={(): void => setIsOpenNewMenu(false)}>
                  {
                    CONFIG.SERVED_ENTITY_TYPES.includes('RECORD_RASTER') &&
                    permissions.isLayerRasterRecordIngestAllowed &&
                    <Tooltip content={intl.formatMessage({ id: 'tab-views.catalog.actions.ingest_raster' })}>
                      <IconButton
                        className="operationIcon mc-icon-Map-Orthophoto"
                        label="NEW RASTER"
                        onClick={(): void => {
                          setIsOpenNewMenu(false);
                          dispatchAction({
                            action: UserAction.ENTITY_ACTION_LAYERRASTERRECORD_CREATE
                          });
                        }}
                      />
                    </Tooltip>
                  }
                  {
                    CONFIG.SERVED_ENTITY_TYPES.includes('RECORD_3D') &&
                    permissions.isLayer3DRecordIngestAllowed &&
                    <Tooltip content={intl.formatMessage({ id: 'tab-views.catalog.actions.ingest_3d' })}>
                      <IconButton
                        className="operationIcon mc-icon-Map-3D"
                        label="NEW 3D"
                        onClick={(): void => {
                          setIsOpenNewMenu(false);
                          dispatchAction({
                            action: UserAction.ENTITY_ACTION_LAYER3DRECORD_CREATE
                          });
                        }}
                      />
                    </Tooltip>
                  }
                  {
                    CONFIG.SERVED_ENTITY_TYPES.includes('RECORD_DEM') &&
                    permissions.isLayerDemRecordIngestAllowed &&
                    <Tooltip content={intl.formatMessage({ id: 'tab-views.catalog.actions.ingest_dem' })}>
                      <IconButton
                        className="operationIcon mc-icon-Map-DTM"
                        label="NEW DEM"
                        onClick={(): void => {
                          setIsOpenNewMenu(false);
                          dispatchAction({
                            action: UserAction.ENTITY_ACTION_LAYERDEMRECORD_CREATE
                          });
                        }}
                      />
                    </Tooltip>
                  }
                </MenuSurface>
                <Tooltip content={intl.formatMessage({ id: 'action.operations.tooltip' })}>
                  <IconButton className="operationIcon mc-icon-Plus" onClick={(): void => setIsOpenNewMenu(!isOpenNewMenu)}/>
                </Tooltip>
              </MenuSurfaceAnchor>
            }
            {/*<Tooltip content={intl.formatMessage({ id: 'action.delete.tooltip' })}>
              <IconButton 
                className="operationIcon mc-icon-Delete"
                label="DELETE"
              />
            </Tooltip>*/}
            {/* <Tooltip content={intl.formatMessage({ id: 'action.filter.tooltip' })}>
              <IconButton 
                className="operationIcon mc-icon-Filter"
                disabled={!(permissions.isSystemFilterEnabled as boolean)}
                label="FILTER"
                onClick={ (): void => { handleFilter(); } }
              />
            </Tooltip> */}
            <PanelExpanderButton />
          </div>
        </div>
      </div>
    );
  };

  const mapLegendsExtractor = useCallback((layers: (ILayerImage & { meta: unknown })[]): IMapLegend[] => {
    const legendDocProtocol = LinkType.LEGEND_DOC;
    const legendImgProtocol = LinkType.LEGEND_IMG;
    const legendObjProtocol = LinkType.LEGEND;
    const legendsProtocols = [legendDocProtocol, legendImgProtocol, legendObjProtocol];

    return layers.reduce((legendsList, cesiumLayer): IMapLegend[] => {
      if (typeof get(cesiumLayer.meta, 'layerRecord.links') !== 'undefined') {
        const cesiumLayerLinks = get(cesiumLayer,'meta.layerRecord.links') as LinkModelType[];

        const layerLegendLinks = cesiumLayerLinks.reduce((legendsByProtocol, link) => {
          const isLegendLink = legendsProtocols.includes(link.protocol as LinkType);

          if (isLegendLink) {
            return { ...legendsByProtocol, [link.protocol as LinkType]: link };
          }
          return legendsByProtocol;
        }, {} as Record<LinkType, LinkModelType>)
        
        const layerLegend: IMapLegend = {
          layer: get(cesiumLayer, 'meta.layerRecord.productName') as string,
          legend: get(cesiumLayer, 'layerLegendsLinks.LEGEND') as Record<string, unknown>[],
          legendDoc: get(layerLegendLinks,'LEGEND_DOC.url') as string,
          legendImg: get(layerLegendLinks,'LEGEND_IMG.url') as string,
        };
        
        const {legendDoc, legendImg} = layerLegend;

        const shouldAddLegend = typeof legendDoc !== 'undefined' || typeof legendImg !== 'undefined';

        if (!shouldAddLegend) {
          return legendsList;
        }

        return [...legendsList, layerLegend];
      }

      return legendsList;
    
    }, [] as IMapLegend[]);

  }, []);

  useEffect(() => {
    if (typeof store.userStore.user?.role !== 'undefined') {
      setUserRole(store.userStore.user.role);
    }
  }, [store.userStore.user]);

  useEffect(() => {
    const isActive = store.discreteLayersStore.isActiveLayersImages as boolean;
    if (!isActive) {
      setCatalogFilter(false);
    }
    if (isActiveLayersFilterEnabled !== isActive) {
      setIsActiveLayersFilterEnabled(isActive);
    }
  }, [store.discreteLayersStore.isActiveLayersImages]);

  useEffect(() => {
    if (!!jobToOpenRasterEntity) {
      setIsRasterEntityDialogOpen(true);
    }
  }, [jobToOpenRasterEntity]);

  const ContextMenuByTab: React.FC<IContextMenuData> = (props) => {
    // Should add global flag or find the proper condition to whether show the context menu or not.
    return <ActionsContextMenu {...props} />;
  };

  const contextMenuSizeByTab = useMemo((): MenuDimensions => {
    return actionsMenuDimensions as MenuDimensions;
  }, [activeTabView, actionsMenuDimensions]);

  const site = useMemo(() => currentSite(), []);

  const triggerCallbackFunc = (data: Feature, options: GeocoderOptions, i: number) => {
    const requestId = data.properties?.headers['request_id'];

    if (!requestId) {
      console.warn('GEOCODING[FEEDBACK]: Missing request_id in response header. Ensure the "Access-Control-Expose-Headers" header includes "request_id".');
    }

    if (!CONFIG.GEOCODER.CALLBACK_URL) return;

    const CATALOG_APP_USER_ID = CONFIG.CATALOG_APP_USER_ID.replace('{CURRENT_USER}', store.userStore?.user?.role as string);

    const body = {
      request_id: requestId,
      chosen_result_id: i,
      user_id: CATALOG_APP_USER_ID
    }

    const url = `${CONFIG.GEOCODER.CALLBACK_URL}?token=${CONFIG.ACCESS_TOKEN.TOKEN_VALUE}`;

    fetch(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  };

  const GEOCODER_OPTIONS = useMemo(() => ([
    {
      baseUrl: CONFIG.GEOCODER.URL,
      endPoint: '/search/location/query',
      method: 'GET',
      params: {
        dynamic: {
          queryText: 'query',
          geoContext: {
            name: 'geo_context',
            relatedParams: [["geo_context_mode", 'filter']]
          }
        },
        static: [
          ["limit", CONFIG.GEOCODER.RESULTS_LIMIT],
          ["disable_fuzziness", false],
          ["token", CONFIG.ACCESS_TOKEN.TOKEN_VALUE]
        ],
      },
      title: intl.formatMessage({ id: 'geocoder-panel.title.location' }),
      callbackFunc: (data, options, i) => { triggerCallbackFunc(data, options, i) }
    },
    {
      baseUrl: CONFIG.GEOCODER.URL,
      endPoint: '/search/control/tiles',
      method: 'GET',
      params: {
        dynamic: {
          queryText: 'tile',
          geoContext: {
            name: 'geo_context',
            relatedParams: [['geo_context_mode', 'filter']],
          }
        },
        static: [
          ["limit", CONFIG.GEOCODER.RESULTS_LIMIT],
          ["disable_fuzziness", false],
          ["token", CONFIG.ACCESS_TOKEN.TOKEN_VALUE]
        ],
      },
      title: intl.formatMessage({ id: 'geocoder-panel.title.tiles' }),
      callbackFunc: (data, options, i) => { triggerCallbackFunc(data, options, i) }
    },
    {
      baseUrl: CONFIG.GEOCODER.URL,
      endPoint: '/search/control/items',
      method: 'GET',
      params: {
        dynamic: {
          queryText: 'command_name',
          geoContext: {
            name: 'geo_context',
            relatedParams: [['geo_context_mode', 'filter']],
          }
        },
        static: [
          ["limit", CONFIG.GEOCODER.RESULTS_LIMIT],
          ["disable_fuzziness", false],
          ["token", CONFIG.ACCESS_TOKEN.TOKEN_VALUE]
        ],
      },
      title: intl.formatMessage({ id: 'geocoder-panel.title.control' }),
      callbackFunc: (data, options, i) => { triggerCallbackFunc(data, options, i) }
    },
    {
      baseUrl: CONFIG.GEOCODER.URL,
      endPoint: '/search/control/routes',
      method: 'GET',
      params: {
        dynamic: {
          queryText: 'command_name',
          geoContext: {
            name: 'geo_context',
            relatedParams: [['geo_context_mode', 'filter']],
          }
        },
        static: [
          ["token", CONFIG.ACCESS_TOKEN.TOKEN_VALUE]
        ],
        // "geo_context": { "bbox": [-180, -90, 180, 90] },
      },
      title: intl.formatMessage({ id: 'geocoder-panel.title.routes' }),
      callbackFunc: (data, options, i) => { triggerCallbackFunc(data, options, i) }
    },
  ]) satisfies GeocoderOptions[], [intl]);

  return (
    <>
      <Box className={`headerContainer ${disableOnDrawingClassName}`}>
        <Box className="headerViewsSwitcher">
          <Box>
           <AppTitle />
          </Box>
          <TabViewsSwitcher
            handleTabViewChange = {handleTabViewChange}
            activeTabView = {activeTabView}
            disabled={isDrawing || store.exportStore.drawingState?.drawing || store.catalogTreeStore.isLoading || searchLoading}
          />
        </Box>
        <Box className="headerSearchOptionsContainer">
          <PolygonSelectionUi
            onCancelDraw={(): void=>{ console.log('****** onCancelDraw ****** called')}}
            onReset={handlePolygonReset}
            onStartDraw={setDrawType}
            onFiltersApply={handleCatalogFiltersApply}
            onFiltersReset={handleCatalogFiltersReset}
            isSelectionEnabled={Array.isArray(drawEntities[0]?.coordinates) ? drawEntities[0]?.coordinates.length > 0 : !!drawEntities[0]?.coordinates}
            onPolygonUpdate={onPolygonSelection}
            onPoiUpdate={onPoiSelection}
            poi={poi}
            corners={corners}
            disabled={activeTabView === TabViews.EXPORT_LAYER}
          />
        </Box>
        <Box className="headerSystemAreaContainer">
          <Tooltip content={intl.formatMessage({ id: 'general.whats-new.tooltip' })}>
            <Box className="position">
              {whatsNewVisitedCnt === 0 &&<Box className="badge badge_primary"></Box>}
              <IconButton
                  className="operationIcon mc-icon-Help"
                  style={{fontSize: '38px'}}
                  label="Whats new?"
                  onClick={ (): void => { 
                    const val = whatsNewVisitedCnt + 1;
                    localStore.set('whatsNewVisitedCnt',val + '');
                    setWhatsNewVisitedCnt(val);
                    window.open(CONFIG.WHATSNEW_URL, '_blank');
                  } }
                />
            </Box>
          </Tooltip>
          <Tooltip content={intl.formatMessage({ id: 'general.login-user.tooltip' }, { user: store.userStore.user?.role })}>
            <Avatar className="avatar" name={store.userStore.user?.role} size="large" />
          </Tooltip>
          {
            permissions.isSwitchUserRoleAllowed &&
            <Box className="headerUserModeSwitchContainer">
              <UserModeSwitch userRole={userRole} setUserRole={store.userStore.changeUserRole}/>
            </Box>
          }
          {
            permissions.isSystemJobsAllowed as boolean &&
            <Tooltip content={intl.formatMessage({ id: 'action.system-jobs.tooltip' })}>
              <IconButton
                className="operationIcon mc-icon-Job-Management"
                label="SYSTEM JOBS"
                onClick={ (): void => { handleSystemsJobsDialogClick(); } }
              />
            </Tooltip>
          }
          {
            permissions.isSystemCoreInfoAllowed as boolean &&
            <Tooltip content={intl.formatMessage({ id: 'action.system-core-info.tooltip' })}>
              <IconButton
                className="operationIcon mc-icon-System-Info"
                label="SYSTEM CORE INFO"
                onClick={ (): void => { handleSystemsCoreInfoDialogClick(); } }
              />
            </Tooltip>
          }
          {
            permissions.isWebToolsAllowed as boolean &&
            CONFIG.WEB_TOOLS_URL &&
            <Tooltip content={intl.formatMessage({ id: 'action.web-tools.tooltip' })}>
              <IconButton
                className="operationIcon mc-icon-Tools"
                label="WEB TOOLS"
                onClick={ (): void => { window.open(CONFIG.WEB_TOOLS_URL); } }
              />
            </Tooltip>
          }
        </Box>
      </Box>
      <Box className="mainViewContainer">
        <Box className={`sidePanelParentContainer ${disableOnDrawingClassName}`}>
        {!tabsPanelExpanded ? (
            <Box
              className="sidePanelContainer"
              style={{
                backgroundColor: theme.custom?.GC_ALTERNATIVE_SURFACE as string,
              }}
            >
              {getActiveTabHeader(activeTabView, site)}
            </Box>
          ) : null}
          <Box 
            className="sidePanelContainer"
            style={{
              backgroundColor: theme.custom?.GC_ALTERNATIVE_SURFACE as string,
              height: activeTabView !== TabViews.EXPORT_LAYER ? (detailsPanelExpanded ? '50%' : '75%') : '100%',
              display: tabsPanelExpanded ? 'block' : 'none',
            }}
          >
            <Box className="tabContentContainer" style={{display: activeTabView === TabViews.CATALOG ? 'block' : 'none'}}>
              {
                getActiveTabHeader(activeTabView, site)
              }
              <Box className="panelContent" style={{ overflow: 'hidden' }}>
                <CatalogTreeComponent
                  refresh={catalogRefresh}
                  isFiltered={catalogFilter}
                />
              </Box>
            </Box>
            {
              activeTabView === TabViews.SEARCH_RESULTS &&
              <Box className="tabContentContainer">
                {
                  getActiveTabHeader(activeTabView, site)
                }
                <LayersResults
                  searchLoading={searchLoading}
                  searchError={searchResultsError} 
                  style={{
                    height: 'calc(100% - 50px)',
                    width: 'calc(100% - 8px)'
                  }}
                />
              </Box>
            }
            {
              activeTabView === TabViews.EXPORT_LAYER &&
              <Box className="tabContentContainer">
                {
                  getActiveTabHeader(activeTabView, site)
                }
                <ExportLayerComponent
                  handleTabViewChange={handleTabViewChange}
                  handleFlyTo={onFlyTo}
                  style={{
                    height: 'calc(100% - 50px)',
                    width: 'calc(100% - 8px)',
                    display: 'flex'
                  }}
                />
              </Box>
            }
          </Box>
          {
            activeTabView !== TabViews.EXPORT_LAYER && 
            <Box className="sidePanelContainer sideDetailsPanel" style={{
              backgroundColor: theme.custom?.GC_ALTERNATIVE_SURFACE as string,
              height: detailsPanelExpanded ? '50%' : '25%',
              display: tabsPanelExpanded ? 'block' : 'none',
            }}>
              <DetailsPanel
                activeTabView={activeTabView}
                detailsPanelExpanded = {detailsPanelExpanded}
                setDetailsPanelExpanded = {setDetailsPanelExpanded}
              />
            </Box>
          }
        </Box>
        <Box className="mapAppContainer">
          <ActionsMenuDimensionsContext.Provider value={{actionsMenuDimensions, setActionsMenuDimensions}}>
            <CesiumMap
              mapMode2D={mapMode2D}
              projection={CONFIG.MAP.PROJECTION}  
              center={CONFIG.MAP.CENTER}
              zoom={CONFIG.MAP.ZOOM}
              sceneMode={CesiumSceneMode.SCENE2D}
              imageryProvider={false}
              locale = {mapSettingsLocale}
              baseMaps={store.discreteLayersStore.baseMaps}
              useOptimizedTileRequests={CONFIG.MAP.USE_OPTIMIZED_TILE_REQUESTS}
              layerManagerFootprintMetaFieldPath={'layerRecord.footprint'}
              // @ts-ignore
              imageryContextMenu={<ContextMenuByTab />}
              imageryContextMenuSize={contextMenuSizeByTab}
              legends={{
                mapLegendsExtractor,
                title: intl.formatMessage({ id: 'map-legends.sidebar-title' }),
                emptyText: intl.formatMessage({ id: 'map-legends.empty-text' }),
                actionsTexts: {
                  docText: intl.formatMessage({ id: 'map-legends.actions.doc' }),
                  imgText: intl.formatMessage({ id: 'map-legends.actions.img' }),
                }
              }}
              showDebuggerTool={CONFIG.MAP.SHOW_DEBUGGER_TOOL}
              showActiveLayersTool={CONFIG.MAP.SHOW_ACTIVE_LAYERS_TOOL}
              {...(CONFIG.MAP.SHOW_GEOCODER_TOOL ? { geocoderPanel: GEOCODER_OPTIONS } : {})}
            >
                {
                  activeTabView !== TabViews.EXPORT_LAYER &&
                  <CesiumDrawingsDataSource
                    drawings={activeTabView === TabViews.SEARCH_RESULTS ? drawEntities : []}
                    drawingMaterial={DRAWING_MATERIAL_COLOR}
                    drawState={{
                      drawing: isDrawing,
                      type: drawPrimitive.type,
                      handler: drawPrimitive.handler,
                    }}
                    hollow={true}
                    outlineWidth={5}
                    material={ (DRAWING_FINAL_MATERIAL as unknown) as CesiumColor }
                  />
                }

                { memoizedLayers }

                { activeTabView === TabViews.EXPORT_LAYER && <ExportDrawingHandler /> }

                <ActionResolver
                  handleOpenEntityDialog = {openEntityByMode}
                  handleFlyTo = {onFlyTo}
                  handleTabViewChange = {handleTabViewChange}
                  activeTabView = {activeTabView}
                  handleOpenJobDialog = {(open, jobData) => {
                    setJobToOpenJobManager(jobData);
                    setSystemsJobsDialogOpen(open);
                  }}
                />

                <Terrain/>
                <ExtentUpdater/>
                <WfsFeature />
                <DemHeightsFeatureComponent />
                <PolygonPartsFeature />
                { poi && activeTabView === TabViews.SEARCH_RESULTS && <PoiEntity longitude={poi.lon} latitude={poi.lat}/> }
                { rect && <FlyTo setRect={setRect} layer={store.discreteLayersStore.selectedLayer as LayerMetadataMixedUnion}/> }
                { activeTabView === TabViews.EXPORT_LAYER && <ExportPolygonsRenderer /> }
            </CesiumMap>
          </ActionsMenuDimensionsContext.Provider>
          {/* <BrowserCompatibilityChecker />  Should talk about if we need it or not anymore. */}
          <GPUInsufficiencyDetector />
        </Box>

        {/* <Filters isFiltersOpened={isFilter} filtersView={activeTabView}/> */}
        {
          isRasterEntityDialogOpen &&
          <EntityRasterDialog
            isOpen={isRasterEntityDialogOpen}
            onSetOpen={setIsRasterEntityDialogOpen}
            job={jobToOpenRasterEntity}
            setJob={(open) => {
              setJobToOpenRasterEntity(open);
              handleCloseDialog();
            }}
          />
        }
        {
          is3DEntityDialogOpen &&
          <EntityDialog
            isOpen={is3DEntityDialogOpen}
            onSetOpen={(open) => {
              setIs3DEntityDialogOpen(open);
              handleCloseDialog();
            }}
            recordType={RecordType.RECORD_3D}
          />
        }
        {
          isDemEntityDialogOpen &&
          <EntityDialog
            isOpen={isDemEntityDialogOpen}
            onSetOpen={(open) => {
              setIsDemEntityDialogOpen(open);
              handleCloseDialog();
            }}
            recordType={RecordType.RECORD_DEM}
          />
        }
        {
          isEntityDialogOpen && 
          <EntityDialog
            isOpen={isEntityDialogOpen}
            onSetOpen={(open) => {
              setEntityDialogOpen(open);
              handleCloseDialog();
            }}
            layerRecord={store.discreteLayersStore.selectedLayer}
          />
        }
        {
          permissions.isDeleteAllowed && store.discreteLayersStore.selectedLayer &&
          <EntityDeleteDialog
            isOpen={isEntityDeleteDialogOpen}
            onSetOpen={(open) => {
              setIsEntityDeleteDialogOpen(open);
              handleCloseDialog();
            }}
            layerRecord={store.discreteLayersStore.selectedLayer}
          />
        }
        {
          isSystemsJobsDialogOpen &&
          <JobsDialog
            isOpen={isSystemsJobsDialogOpen}
            onSetOpen={setSystemsJobsDialogOpen}
            setRestoreFromJob={setJobToOpenRasterEntity}
            focusOnJob={jobToOpenJobManager}
            setFocusOnJob={setJobToOpenJobManager}
          />
        }
        {
          isSystemCoreInfoDialogOpen &&
          <SystemCoreInfoDialog
            isOpen={isSystemCoreInfoDialogOpen}
            onSetOpen={setSystemCoreInfoDialogOpen}
          />
        }
      </Box>
    </>
  );
});

export default DiscreteLayerView;
