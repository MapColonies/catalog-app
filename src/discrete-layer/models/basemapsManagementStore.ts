import { types, getParent, flow } from 'mobx-state-tree';
import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
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
        details { protocol name url }
      }
    }
  }
`;
// The position in the array is the single definition of layer order (bottom to top): `order` is always
// rewritten from it, so it is contiguous (0..n-1) and can never have ties or gaps.
const normalizeLayersOrder = (layers: BasemapLayerModelType[]): BasemapLayerModelType[] => {
  return [...layers]
    .sort((curr, next) => {
      return (curr.order ?? 0) - (next.order ?? 0);
    })
    .map((layer, index) => {
      return { ...layer, order: index };
    });
};

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
          const response: { basemaps: BasemapModelType[] } = yield self.root
            .queryBasemaps({}, BASEMAPS_QUERY_SELECTOR)
            .refetch();
          self.basemaps = cloneDeep(response.basemaps).map((basemap) => {
            return { ...basemap, layers: normalizeLayersOrder([...(basemap.layers ?? [])]) };
          });
        } catch (error) {
          console.error(error);
        }
      }
    );

    const toggleBasemap = (id: string | undefined): void => {
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
      
      const draftBasemap = cloneDeep(basemap) ?? ({
        __typename: 'Basemap',
        id: uuidv4(),
        name: '',
        thumbnail: { url: '', width: 128, height: 128 },
        isCurrent: false,
        isForPreview: false,
        layers: [],
      } as unknown as BasemapModelType);
      self.draftBasemap = { ...draftBasemap, layers: normalizeLayersOrder([...(draftBasemap.layers ?? [])]) };
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
      updateDraft({ layers: normalizeLayersOrder(layers) });
    };

    // Called when the order was changed on the map. `layerIds` are ordered bottom to top and may include
    // map layers that are not part of the draft. Draft layers that are not on the map keep their slot.
    const syncDraftLayerOrder = (layerIds: string[]): void => {
      const layers = self.draftBasemap?.layers;
      if (layers === undefined) {
        return;
      }
      const layersById = new Map(layers.map((layer) => [layer.id, layer]));
      const mappedLayers = layerIds.flatMap((id) => layersById.get(id) ?? []);
      const mappedIds = new Set(mappedLayers.map((layer) => layer.id));
      let nextMappedIndex = 0;
      const reorderedLayers = layers.map((layer) => {
        return mappedIds.has(layer.id) ? mappedLayers[nextMappedIndex++] : layer;
      });
      if (reorderedLayers.every((layer, index) => layer === layers[index])) {
        return;
      }
      setDraftLayers(reorderedLayers);
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

    // `fromIndex` / `toIndex` are positions in the draft layers list, bottom to top.
    const moveDraftLayer = (fromIndex: number, toIndex: number): void => {
      const layers = [...(self.draftBasemap?.layers ?? [])];
      const [moved] = layers.splice(fromIndex, 1);
      if (moved === undefined) {
        return;
      }
      layers.splice(toIndex, 0, moved);
      setDraftLayers(layers.map((layer, index) => ({ ...layer, order: index })));
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
        const newLayers = rasterLayers.map((layer, index) => ({
          id: uuidv4(),
          order: currentLayers.length + index,
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
      toggleBasemap,
      exportBasemap,
      makeDefaultBasemap,
    };
  });
