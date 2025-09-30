/* eslint-disable camelcase */
import { types, Instance, flow, getParent } from 'mobx-state-tree';
import { cloneDeep, set, get } from 'lodash';
import { Feature, GeoJsonProperties, Geometry, Polygon } from 'geojson';
import lineStringToPolygon from '@turf/linestring-to-polygon';
import intersect from '@turf/intersect';
import bboxPolygon from '@turf/bbox-polygon';
import bbox from '@turf/bbox';
import { IBaseMaps } from '@map-colonies/react-components/dist/cesium-map/map';
import { ApiHttpResponse } from '../../common/models/api-response';
import { ResponseState } from '../../common/models/response-state.enum';
import { MOCK_DATA_IMAGERY_LAYERS_ISRAEL } from '../../__mocks-data__/search-results.mock';
import CONFIG from '../../common/config';
import { isUnpublished } from '../../common/helpers/style';
import { LinkType } from '../../common/models/link-type.enum';
import { getLayerLink } from '../components/helpers/layersUtils';
import { LayerMetadataMixedUnionKeys, LayerRecordTypes, LayerRecordTypesKeys } from '../components/layer-details/entity-types-keys';
import { extractDescriptorRelatedFieldNames, getFlatEntityDescriptors } from '../components/layer-details/utils';
import { TabViews } from '../views/tab-views';
import { searchParams } from './search-params';
import { IRootStore, RootStoreType } from './RootStore';
import { ILayerImage } from './layerImage';
import { ModelBase } from './ModelBase';
import { EntityDescriptorModelType } from './EntityDescriptorModel';
import { CapabilityModelType } from './CapabilityModel';
import { FieldConfigModelType } from './FieldConfigModel';
import { GetFeatureModelType } from './GetFeatureModel';
import { RecordType } from './RecordTypeEnum';
import { WfsPolygonPartsGetFeatureParams } from './RootStore.base';
import { RecordStatus } from './RecordStatusEnum';
import { Layer3DRecordModelType } from './Layer3DRecordModel';

export type LayersImagesResponse = ILayerImage[];

export interface SearchResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export type SearchResponse = ApiHttpResponse<SearchResult>;

export interface ITabViewData {
  idx: TabViews;
  selectedLayer?: ILayerImage;
  layersImages?: ILayerImage[];
  filters?: unknown;
  polygonPartsLayer?: ILayerImage;
  polygonPartsInfo?: Feature<Geometry, GeoJsonProperties>[];
}

const INITIAL_STATE = {
  searchParams: {},
  layersImages: [],
  highlightedLayer: null,
  selectedLayer: null,
  selectedLayerIsUpdateMode: false,
  selectedLayerIsDeleteMode: false,
  tabViews: [{idx: TabViews.CATALOG}, {idx: TabViews.SEARCH_RESULTS}, {idx: TabViews.EXPORT_LAYER}],
  entityDescriptors: [],
  entityTooltipFields: new Map(),
  previewedLayers: [],
  capabilities: [],
  baseMaps: CONFIG.BASE_MAPS,
  mapViewerExtentPolygon: undefined,
  customValidationError: undefined,
  ppCollisionCheckInProgress: undefined,
  polygonPartsLayer: undefined,
  polygonPartsInfo: [],
  isActiveLayersImages: false,
};

export type PolygonPartsWfsFeatureInfo = GetFeatureModelType & Pick<WfsPolygonPartsGetFeatureParams, 'feature'>;

export const discreteLayersStore = ModelBase
  .props({
    state: types.enumeration<ResponseState>(
      'State',
      Object.values(ResponseState)
    ),
    searchParams: types.optional(searchParams, INITIAL_STATE.searchParams),
    layersImages: types.maybe(types.frozen<LayersImagesResponse>(INITIAL_STATE.layersImages)),
    highlightedLayer: types.maybe(types.frozen<ILayerImage>(INITIAL_STATE.highlightedLayer as unknown as ILayerImage)),
    selectedLayer: types.maybe(types.frozen<ILayerImage>(INITIAL_STATE.selectedLayer as unknown as ILayerImage)),
    selectedLayerIsUpdateMode: types.maybe(types.frozen<boolean>(INITIAL_STATE.selectedLayerIsUpdateMode)),
    selectedLayerIsDeleteMode: types.maybe(types.frozen<boolean>(INITIAL_STATE.selectedLayerIsDeleteMode)),
    tabViews: types.maybe(types.frozen<ITabViewData[]>(INITIAL_STATE.tabViews)),
    entityDescriptors: types.maybe(types.frozen<EntityDescriptorModelType[]>(INITIAL_STATE.entityDescriptors)),
    entityTooltipFields: types.maybe(types.frozen<Map<LayerRecordTypes, FieldConfigModelType[]>>(INITIAL_STATE.entityTooltipFields)),
    previewedLayers: types.maybe(types.frozen<string[]>(INITIAL_STATE.previewedLayers)),
    capabilities: types.maybe(types.frozen<CapabilityModelType[]>(INITIAL_STATE.capabilities)),
    baseMaps: types.maybe(types.frozen<IBaseMaps>(INITIAL_STATE.baseMaps)),
    mapViewerExtentPolygon: types.maybe(types.frozen<Feature|undefined>(INITIAL_STATE.mapViewerExtentPolygon)),
    customValidationError: types.maybe(types.frozen<Record<string,string[]>|undefined>(INITIAL_STATE.customValidationError)),
    ppCollisionCheckInProgress: types.maybe(types.frozen<boolean|undefined>(INITIAL_STATE.ppCollisionCheckInProgress)),
    polygonPartsLayer: types.maybe(types.frozen<ILayerImage>(INITIAL_STATE.polygonPartsLayer as unknown as ILayerImage)),
    polygonPartsInfo: types.maybe(types.frozen<Feature<Geometry, GeoJsonProperties>[]>(INITIAL_STATE.polygonPartsInfo)),
    isActiveLayersImages: types.maybe(types.frozen<boolean>(INITIAL_STATE.isActiveLayersImages)),
    
    // Don't forget to update INITIAL_STATE as well when adding new state value.
  })
  .views((self) => ({
    get store(): IRootStore {
      return self.__getStore<RootStoreType>()
    },
    get root(): IRootStore {
      return getParent(self);
    },
  }))
  .actions((self) => {
    const store = self.root;

    const getLayersImages: () => Promise<void> = flow(
      function* getLayersImages(): Generator<
        Promise<LayersImagesResponse>, //SearchResponse
        void,
        LayersImagesResponse
      > {
        try {
          self.state = ResponseState.IDLE;
          // TODO: MOCK should be replaced by actual API call
          // const result = yield self.root.fetch('/searchLayerImages', 'GET', {});
          // const result = yield Promise.resolve(createMockData(20,'mock'));
          
          // *** communicate with pycsw directly - CORS
          // const result = yield self.root.fetch('http://127.0.0.1:54532/?version=2.0.2&service=CSW&request=GetRecords&typeNames=csw:Record&ElementSetName=full&resultType=results&outputSchema=http://schema.mapcolonies.com&outputFormat=application/json', 'GET', {});
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const result = yield Promise.resolve(MOCK_DATA_IMAGERY_LAYERS_ISRAEL);
          self.layersImages = filterBySearchParams(result).map(item => ({...item, footprintShown: true, layerImageShown: false, order: null}));
        } catch (error) {
          console.error(error);
          self.state = ResponseState.ERROR;
        }
      }
    );

    function setEntityDescriptors(data: EntityDescriptorModelType[]): void {
      self.entityDescriptors = cloneDeep(data);

      LayerRecordTypesKeys.forEach((layerRecordTypename: string) => {
        const flatEntityDescriptors = getFlatEntityDescriptors(layerRecordTypename as LayerRecordTypes, self.entityDescriptors as EntityDescriptorModelType[]);
        const fieldNames = extractDescriptorRelatedFieldNames('isInfoTooltip', flatEntityDescriptors);
        const fields: FieldConfigModelType[] = flatEntityDescriptors.filter((field: FieldConfigModelType) => fieldNames.includes(field.fieldName as string));
        self.entityTooltipFields?.set(layerRecordTypename as LayerRecordTypes, fields);
      });
    }

    function getPreparedLayersImages(data: ILayerImage[], showFootprint = true): LayersImagesResponse {
      // self.layersImages = filterBySearchParams(data).map(item => ({...item, footprintShown: true, layerImageShown: false, order: null}));

      // Filter out Unpublished entries on User premissions.
      const isUserAdmin = store.userStore.isUserAdmin();
      const filteredLayersImages = data.filter(layer => isUserAdmin || !isUnpublished(layer as unknown as Record<string, unknown>));
      
      const preparedLayersImages = filteredLayersImages.map(item => {
        let additional = {};
        if (item.type === RecordType.RECORD_RASTER) {
          const layerLink = getLayerLink(item);
          const hasCapabilities = self.capabilities?.find(item => layerLink.name === item.id);
          const hasWMTSUrl = layerLink.protocol === LinkType.WMTS;
          additional = { layerURLMissing: !hasCapabilities && hasWMTSUrl };
        }
        if (item.type === RecordType.RECORD_3D) {
          additional = {
            isBeingDeleted: (item as Layer3DRecordModelType).productStatus === RecordStatus.BEING_DELETED
          }
        }
        return {
          ...item,
          footprintShown: showFootprint,
          layerImageShown: false,
          order: null,
          ...additional
        };
      });

      return preparedLayersImages;
    }

    function setLayersImages(data: ILayerImage[], showFootprint = true): LayersImagesResponse {
      self.layersImages = getPreparedLayersImages(data, showFootprint);
      setIsActiveLayersImages();
      return self.layersImages;
    }

    function setLayersImagesData(data: ILayerImage[]): void {
      self.layersImages = data.map(item => ({
          ...item,
          layerImageShown: false,
          order: null
        })
      );
    }

    function refreshLayersImages(): void {
      self.layersImages = self.layersImages?.map(item => ({
          ...item,
        })
      );
    }

    function updateLayer(data: ILayerImage): void {
      // self.layersImages = filterBySearchParams(data).map(item => ({...item, footprintShown: true, layerImageShown: false, order: null}));
      const layerForUpdate = self.layersImages?.find(layer => layer.id === data.id);
      for (const key in layerForUpdate) {
        set(layerForUpdate, key, get(data,key));
      }
    }

    // TODO: Remove when actual API is integrated
    function filterBySearchParams(layers: ILayerImage[]): ILayerImage[] {
      return layers.filter((layer) => {
        let layerBBoxPolygon: Polygon;
        const geometry: Geometry = layer.footprint as Geometry;
        switch (geometry.type) {
          case 'Polygon':
            layerBBoxPolygon = layer.footprint as Polygon;
            break;
          case 'MultiPolygon':
            layerBBoxPolygon = bboxPolygon(bbox(geometry)).geometry;
            break;
          case 'LineString':
            layerBBoxPolygon = lineStringToPolygon(geometry).geometry;
            break;
          default:
            throw(new Error('Unknown Geojson feature type'));
        }
        const intersection = intersect(
          layerBBoxPolygon, 
          {
            ...(self.searchParams.geojson as Polygon)
          }
        );
        return intersection ? true : false;
      });
    }

    function clearLayersImages(): void {
      self.layersImages = [];
    }

    function showPolygonParts(id: string, isShow: boolean): void {
      self.layersImages = self.layersImages?.map(el => {return {...el, polygonPartsShown: (el.id === id && isShow)};});
      setIsActiveLayersImages();
    }

    function showLayer(id: string, isShow: boolean, order: number | null): void {
      self.layersImages = self.layersImages?.map(el => el.id === id ? {...el, layerImageShown: isShow, order} : el);
      setIsActiveLayersImages();
    }

    function showFootprint(id: string, isShow: boolean): void {
      self.layersImages = self.layersImages?.map(el => el.id === id ? {...el, footprintShown: isShow} : el);
      setIsActiveLayersImages();
    }

    function highlightLayer(layer: ILayerImage | undefined): void {
      self.highlightedLayer = layer ? cloneDeep(layer) : undefined;
    }

    function selectLayer(layer: ILayerImage | undefined, isUpdateMode: boolean | undefined = undefined, isDeleteMode: boolean | undefined = undefined): void {
      self.selectedLayer = layer ? cloneDeep(layer) : undefined;
      self.selectedLayerIsUpdateMode = isUpdateMode;
      self.selectedLayerIsDeleteMode = isDeleteMode;
    }

    function resetUpdateMode(): void {
      self.selectedLayerIsUpdateMode = false;
      self.ppCollisionCheckInProgress = undefined;
      self.customValidationError = undefined;
    }

    function selectLayerByID(layerID: string): void {
      const layer = self.layersImages?.find(layer => layer.id === layerID);
      self.selectedLayer = layer ? cloneDeep(layer) : undefined;
    }

    function setTabviewData(tabView: TabViews, customLayersImages?: ILayerImage[]): void {
      if (self.tabViews) {
        const idxTabViewToUpdate = self.tabViews.findIndex((tab) => tab.idx === tabView);

        if (customLayersImages) {
          const preparedLayersImages = getPreparedLayersImages([...customLayersImages]);
          self.tabViews[idxTabViewToUpdate].layersImages = preparedLayersImages;
          self.tabViews[idxTabViewToUpdate].selectedLayer = undefined;
          self.tabViews[idxTabViewToUpdate].polygonPartsLayer = undefined;
          self.tabViews[idxTabViewToUpdate].polygonPartsInfo = [];
        } else {
          self.tabViews[idxTabViewToUpdate].selectedLayer = self.selectedLayer ? { ...self.selectedLayer } : undefined;
          self.tabViews[idxTabViewToUpdate].polygonPartsLayer = self.polygonPartsLayer ? { ...self.polygonPartsLayer } : undefined;
          self.tabViews[idxTabViewToUpdate].polygonPartsInfo = [ ...(self.polygonPartsInfo ?? []) ];
          self.tabViews[idxTabViewToUpdate].layersImages = [ ...(self.layersImages ?? []) ];
        }
      } 
    }

    function restoreTabviewData(tabView: TabViews): void {
      if (self.tabViews) {
        const idxTabViewToUpdate = self.tabViews.findIndex((tab) => tab.idx === tabView);
        self.selectedLayer = self.tabViews[idxTabViewToUpdate].selectedLayer;
        self.polygonPartsLayer = self.tabViews[idxTabViewToUpdate].polygonPartsLayer;
        self.polygonPartsInfo = self.tabViews[idxTabViewToUpdate].polygonPartsInfo ?? [];
        self.layersImages = self.tabViews[idxTabViewToUpdate].layersImages ?? [];
      } 
    }

    function updateTabviewsData(layer: ILayerImage): void {
      if (self.tabViews) {
        self.tabViews.forEach((tab) => {
          if (tab.selectedLayer && tab.selectedLayer.id === layer.id) {
            tab.selectedLayer = cloneDeep(layer);
          }
          if (tab.layersImages) {
            tab.layersImages = tab.layersImages.map((item) => {
              if (item.id === layer.id) {
                return cloneDeep(layer);
              }
              return item;
            });
          }
        });
      } 
    }

    function addPreviewedLayer(id: string): void {
      self.previewedLayers = [
        ...self.previewedLayers ?? [],
        id
      ];
    }

    function removePreviewedLayer(id: string): void {
      self.previewedLayers = self.previewedLayers?.filter(layerId => layerId !== id);
    }

    function isPreviewedLayer(id: string): boolean {
      return self.previewedLayers?.find(layerId => layerId === id) !== undefined ? true : false;
    }

    function cleanPreviewedLayer(): void {
      self.previewedLayers = [];
    }

    function setCapabilities(data: CapabilityModelType[]): CapabilityModelType[] {
      self.capabilities = cloneDeep(data);
      return self.capabilities;
    }

    function setBaseMaps(baseMaps: IBaseMaps): void {
      self.baseMaps = cloneDeep(baseMaps);
    }

    function getEditablePartialObject(layerImage: ILayerImage, extraNonDescriptorFields?: string[]): Record<string, unknown> {
      const flatDescriptors = getFlatEntityDescriptors(layerImage.__typename, self.entityDescriptors as EntityDescriptorModelType[]);
      const filteredLayer: Record<string, unknown> = {};
      
      flatDescriptors.forEach(fieldConfig => {
        // Field is considered mutable if it is manually editable via form, or during automatic process.
        const isFieldMutable = fieldConfig.isManuallyEditable === true || fieldConfig.isLifecycleEnvolved === true;

        if (isFieldMutable) {
          set(filteredLayer, fieldConfig.fieldName as string, get(layerImage, fieldConfig.fieldName as string));
        }
      });

      extraNonDescriptorFields?.forEach(nonDescField => {
        set(filteredLayer, nonDescField, get(layerImage, nonDescField));
      });

      return filteredLayer;
    }

    function resetAppState(withoutFields: string[] = []): void {
      Object.entries(INITIAL_STATE).forEach(([statekey, initialVal]) => {
        if (!withoutFields.includes(statekey)) {
          set(self, statekey, initialVal);
        }
      })
    }

    function resetTabView(tabsToReset?: TabViews[]): void {
      let tabsIdx: TabViews[] = self.tabViews?.map(tab => tab.idx) ?? [];
      
      if (tabsToReset) {
        tabsIdx = tabsToReset;
      }

      const resetTabs = self.tabViews?.map(tab => {
        if (tabsIdx.includes(tab.idx)) {
          return ({
            idx: tab.idx
          });
        }
        return tab;
      });

      self.tabViews = resetTabs;
    }

    function resetSelectedLayer(): void {
      self.selectedLayer = undefined;
    }

    function getFieldConfig(
      layerRecordType: LayerRecordTypes,
      fieldName: LayerMetadataMixedUnionKeys
    ): FieldConfigModelType | undefined {
      const descriptors = self.entityDescriptors;
      if (typeof descriptors === 'undefined') return undefined;

      const layerDescriptors = getFlatEntityDescriptors(layerRecordType, descriptors);

      return layerDescriptors.find(descriptor => descriptor.fieldName === fieldName);
    }

    function setMapViewerExtentPolygon(feature: Feature): void {
      self.mapViewerExtentPolygon = cloneDeep(feature);
    }

    function setCustomValidationError(err: Record<string, string[]> | undefined): void {
      self.customValidationError = cloneDeep(err);
    }

    function clearCustomValidationError(): void {
      self.customValidationError = undefined;
    }

    function setPPCollisionCheckInProgress(val: boolean | undefined): void {
      self.ppCollisionCheckInProgress = val;
    }

    function setPolygonPartsLayer(layer: ILayerImage | undefined): void {
      self.polygonPartsLayer = layer ? cloneDeep(layer) : undefined;
    }

    function setPolygonPartsInfo(polygonPartsInfo: Feature<Geometry, GeoJsonProperties>[]): void {
      self.polygonPartsInfo = [ ...(polygonPartsInfo ?? []) ];
    }

    function addPolygonPartsInfo(polygonPartsInfo: Feature<Geometry, GeoJsonProperties>[]): void {
      self.polygonPartsInfo = [ ...(self.polygonPartsInfo ?? []), ...(polygonPartsInfo ?? []) ];
    }

    function resetPolygonPartsInfo(): void {
      self.polygonPartsInfo = [];
    }

    function resetPolygonParts(): void {
      self.polygonPartsLayer = undefined;
      resetPolygonPartsInfo();
    }

    function setIsActiveLayersImages(): void {
      const activeLayersImages = self.layersImages?.filter(layer => layer.layerImageShown || layer.footprintShown || (layer as any).polygonPartsShown) ?? [];
      const isActiveLayersImages = activeLayersImages.length > 0;
      if (self.isActiveLayersImages !== isActiveLayersImages) {
        self.isActiveLayersImages = isActiveLayersImages;
      }
    }


    return {
      getLayersImages,
      getPreparedLayersImages,
      setLayersImages,
      setLayersImagesData,
      refreshLayersImages,
      clearLayersImages,
      showPolygonParts,
      showLayer,
      showFootprint,
      highlightLayer,
      selectLayer,
      selectLayerByID,
      setTabviewData,
      resetSelectedLayer,
      restoreTabviewData,
      updateTabviewsData,
      setEntityDescriptors,
      updateLayer,
      addPreviewedLayer,
      cleanPreviewedLayer,
      removePreviewedLayer,
      isPreviewedLayer,
      setCapabilities,
      setBaseMaps,
      getEditablePartialObject,
      resetAppState,
      resetTabView,
      getFieldConfig,
      resetUpdateMode,
      setMapViewerExtentPolygon,
      setCustomValidationError,
      clearCustomValidationError,
      setPPCollisionCheckInProgress,
      setPolygonPartsLayer,
      setPolygonPartsInfo,
      addPolygonPartsInfo,
      resetPolygonPartsInfo,
      resetPolygonParts
    };
  });

export interface IConflictsStore extends Instance<typeof discreteLayersStore> {}
