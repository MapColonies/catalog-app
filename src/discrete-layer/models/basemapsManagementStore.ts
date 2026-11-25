import { types, getParent, flow } from 'mobx-state-tree';
import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { ResponseState } from '../../common/models/response-state.enum';
import { Domain } from '../../common/models/domain';
import { ModelBase } from './ModelBase';
import { BasemapModelType } from './BasemapModel';
import { BasemapLayerModelType } from './BasemapLayerModel';
import { SourceType } from './SourceTypeEnum';
import { ResourceResolutionStatus } from './ResourceResolutionStatusEnum';
import { BasemapLayerInput } from './RootStore.base';
import { getLayerLink } from '../components/helpers/layersUtils';
import { CapabilityModelType } from './CapabilityModel';
import { LayerRasterRecordModelType } from './LayerRasterRecordModel';
import { LayerMetadataMixedUnion } from './LayerMetadataMixedModelSelector';
import { RecordType } from './RecordTypeEnum';
import { IRootStore, RootStoreType } from './RootStore';

// Requests the full basemap entity against `catalog-web-app-bff`'s `basemaps` query, including both
// `BasemapLayerSource` union branches - a plain string selector, since the union's inline fragments
// aren't worth building through the generated selector classes here.
const BASEMAPS_QUERY_SELECTOR = `
  id name isCurrent isForPreview
  thumbnail { url width height }
  layers {
    id order opacity shouldBeUsedInModelDraping
    source {
      __typename
      ... on CatalogResourceSource {
        type domain status
        uniqueness { productId productType }
        layer {
          __typename
          id productId productType productName description srs srsName classification producerName
          region sensors imagingTimeBeginUTC imagingTimeEndUTC updateDateUTC creationDateUTC ingestionDate
          minResolutionDeg maxResolutionDeg minResolutionMeter maxResolutionMeter
          minHorizontalAccuracyCE90 maxHorizontalAccuracyCE90 transparency productBoundingBox
          productSubType rms scale insertDate keywords footprint
          links { name description protocol url }
        }
        capabilities {
          id format
          style { value isDefault }
          tileMatrixSet { tileMatrixSetID tileMatrixLabels }
          url { format resourceType template }
        }
      }
      ... on ExternalLayerSource {
        type status
        details { protocol name url extras }
      }
    }
  }
`;
const toBasemapLayerInput = (
  layer: BasemapLayerModelType
): BasemapLayerInput => {
  const { source, ...rest } = layer;
  if (source?.__typename === 'ExternalLayerSource') {
    return {
      ...rest,
      source: {
        type: source.type,
        details: source.details,
      },
    } as BasemapLayerInput;
  }

  return {
    ...rest,
    source: {
      type: source?.type,
      domain: source?.domain,
      uniqueness: source?.uniqueness,
    },
  } as BasemapLayerInput;
};

export const basemapsManagementStore = ModelBase
  .props({
    state: types.enumeration<ResponseState>(
      'State',
      Object.values(ResponseState)
    ),
    // TODO: this should be taken from the global store it shouldn't be here at all!
    basemaps: types.maybe(types.frozen<BasemapModelType[]>([])),
    shownBasemapId: types.maybe(types.string),
    draftBasemap: types.maybe(types.frozen<BasemapModelType>()),
  })
  .views((self) => ({
    get store(): IRootStore {
      return self.__getStore<RootStoreType>()
    },
    get root(): IRootStore {
      return getParent(self);
    },
    get shownBasemap(): BasemapModelType | undefined {
      return self.basemaps?.find((basemap) => basemap.id === self.shownBasemapId);
    },
    get displayedBasemap(): BasemapModelType | undefined {
      return self.draftBasemap ?? this.shownBasemap;
    },
  }))
  .actions((self) => {
    const getBasemaps: () => Promise<void> = flow(
      function* getBasemaps() {
        try {
          self.state = ResponseState.PENDING;
          const response: { basemaps: BasemapModelType[] } = yield self.root
            .queryBasemaps({}, BASEMAPS_QUERY_SELECTOR)
            .refetch();
          self.basemaps = cloneDeep(response.basemaps);
          self.state = ResponseState.DONE;
        } catch (error) {
          console.error(error);
          self.state = ResponseState.ERROR;
        }
      }
    );

    const showBasemap = (id: string): void => {
      self.shownBasemapId = self.shownBasemapId === id ? undefined : id;
    };

    const exportBasemap = (id: string): void => {
      console.log(`EXPORT basemap ${id}`);
    };

    const makeDefaultBasemap = (id: string): void => {
      console.log(`MAKE DEFAULT basemap ${id}`);
    };

    const startDraft = (id?: string): void => {
      const basemap = id === undefined ? undefined : self.basemaps?.find((item) => item.id === id);
      if (id !== undefined && basemap === undefined) {
        throw new Error(`Cannot start draft: basemap ${id} was not found`);
      }
      
      self.draftBasemap = cloneDeep(basemap) ?? ({
        __typename: 'Basemap',
        id: uuidv4(),
        name: '',
        thumbnail: { url: '', width: 128, height: 128 },
        isCurrent: false,
        isForPreview: false,
        layers: [],
      } as unknown as BasemapModelType);
    };

    const clearDraft = (): void => {
      self.draftBasemap = undefined;
    };

    const updateDraft = (patch: Partial<Omit<BasemapModelType, 'id'>>): void => {
      if (self.draftBasemap) {
        self.draftBasemap = { ...self.draftBasemap, ...patch };
      }
    };

    const setDraftLayers = (layers: BasemapLayerModelType[]): void => {
      updateDraft({ layers });
    };

    // IDs are supplied bottom-first, matching Cesium's imagery collection.
    const syncDraftLayerOrder = (layerIds: string[]): void => {
      const layers = self.draftBasemap?.layers;
      if (layers === undefined) {
        return;
      }
      const orderedLayers = [...layers].sort((curr, next) => (curr.order ?? 0) - (next.order ?? 0));
      const draftLayerIds = new Set(layers.map((layer) => layer.id));
      const mapLayerIds = layerIds.filter((id) => draftLayerIds.has(id));
      const displayedIds = new Set(mapLayerIds);
      const displayedLayers = orderedLayers.filter((layer) => displayedIds.has(layer.id));
      if (displayedLayers.every((layer, index) => layer.id === mapLayerIds[index])) {
        return;
      }
      const orders = new Map(mapLayerIds.map((id, index) => [id, displayedLayers[index].order]));
      setDraftLayers(layers.map((layer) => ({ ...layer, order: orders.get(layer.id) ?? layer.order })));
    };

    const setDraftLayerOpacity = (layerId: string, opacity: number): void => {
      setDraftLayers(
        (self.draftBasemap?.layers ?? []).map((layer) =>
          layer.id === layerId ? { ...layer, opacity } : layer
        )
      );
    };

    const removeDraftLayer = (layerId: string): void => {
      setDraftLayers((self.draftBasemap?.layers ?? []).filter((layer) => layer.id !== layerId));
    };

    // `fromIndex` / `toIndex` are positions in the ascending `order` list.
    const moveDraftLayer = (fromIndex: number, toIndex: number): void => {
      const orderedLayers = [...(self.draftBasemap?.layers ?? [])].sort(
        (curr, next) => (curr.order ?? 0) - (next.order ?? 0)
      );
      const [moved] = orderedLayers.splice(fromIndex, 1);
      if (moved === undefined) {
        return;
      }
      orderedLayers.splice(toIndex, 0, moved);
      setDraftLayers(orderedLayers.map((layer, index) => ({ ...layer, order: index })));
    };

    const addDraftLayers: (layers: LayerMetadataMixedUnion[]) => Promise<void> = flow(
      function* addDraftLayers(layers: LayerMetadataMixedUnion[]) {
        const rasterLayers = layers.filter(
          (layer) => layer.type === RecordType.RECORD_RASTER
        ) as LayerRasterRecordModelType[];
        if (rasterLayers.length === 0) {
          return;
        }
        let capabilities: CapabilityModelType[] = [];
        try {
          capabilities = cloneDeep(
            (yield self.root.catalogTreeStore.fetchLayersCapabilities(
              rasterLayers
            )) as CapabilityModelType[]
          );
        } catch (error) {
          console.error(error);
        }
        const currentLayers = self.draftBasemap?.layers ?? [];
        const topOrder = currentLayers.reduce((max, layer) => Math.max(max, layer.order ?? 0), -1);
        const newLayers = rasterLayers.map((layer, index) => ({
          id: uuidv4(),
          order: topOrder + 1 + index,
          opacity: 1,
          source: {
            __typename: 'CatalogResourceSource',
            type: SourceType.CATALOG_RESOURCE,
            domain: Domain.RASTER,
            status: ResourceResolutionStatus.RESOLVED,
            uniqueness: {
              productId: layer.productId,
              productType: layer.productType,
            },
            capabilities:
              capabilities.find((capability) => capability.id === getLayerLink(layer)?.name) ??
              null,
            // plain JSON copy: `frozen` cannot hold MST nodes
            layer: JSON.parse(JSON.stringify(layer)) as LayerRasterRecordModelType,
          },
        })) as unknown as BasemapLayerModelType[];
        setDraftLayers([...currentLayers, ...newLayers]);
      }
    );

    // TODO: MOCK should be replaced by actual API calls
    const saveBasemap = async (thumbnail?: Blob): Promise<void> => {
      if (!self.draftBasemap) {
        throw new Error('Cannot save a basemap without a draft');
      }
      const input = {
        ...self.draftBasemap,
        layers: (self.draftBasemap.layers ?? []).map(toBasemapLayerInput),
      };
      if (thumbnail !== undefined) {
        // TODO: Should be actual returned url.
        const url = 'https://placehold.co/128x128?text=OSM'; // await mockUploadBasemapThumbnail(thumbnail);
        input.thumbnail = { ...input.thumbnail, url };
      }
      console.log('SAVE basemap', input);
    };

    const exportDraftBasemap = (): void => {
      console.log('EXPORT draft basemap', self.draftBasemap?.id);
    };

    return {
      startDraft,
      clearDraft,
      updateDraft,
      setDraftLayerOpacity,
      removeDraftLayer,
      moveDraftLayer,
      syncDraftLayerOrder,
      addDraftLayers,
      saveBasemap,
      exportDraftBasemap,
      getBasemaps,
      showBasemap,
      exportBasemap,
      makeDefaultBasemap,
    };
  });
