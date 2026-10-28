import { types, getParent, flow } from 'mobx-state-tree';
import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { ResponseState } from '../../common/models/response-state.enum';
import { Domain } from '../../common/models/domain';
import { ModelBase } from './ModelBase';
import {
  BasemapLayerOutput,
  BasemapOutput,
  mockBasemaps,
  SourceTypeOutput,
} from '../components/basemaps/XXXbasemapMockXXX';
import { getLayerLink } from '../components/helpers/layersUtils';
import { CapabilityModelType } from './CapabilityModel';
import { LayerRasterRecordModelType } from './LayerRasterRecordModel';
import { LayerMetadataMixedUnion } from './LayerMetadataMixedModelSelector';
import { RecordType } from './RecordTypeEnum';
import { IRootStore, RootStoreType } from './RootStore';

export const basemapsManagementStore = ModelBase
  .props({
    state: types.enumeration<ResponseState>(
      'State',
      Object.values(ResponseState)
    ),
    // TODO: this should be taken from the global store it shouldn't be here at all!
    basemaps: types.maybe(types.frozen<BasemapOutput[]>([])),
    capabilities: types.optional(types.frozen<CapabilityModelType[]>(), []),
    shownBasemapId: types.maybe(types.string),
    editedBasemap: types.maybe(types.frozen<BasemapOutput>()),
    draftBasemap: types.maybe(types.frozen<BasemapOutput>()),
  })
  .views((self) => ({
    get store(): IRootStore {
      return self.__getStore<RootStoreType>()
    },
    get root(): IRootStore {
      return getParent(self);
    },
    get shownBasemap(): BasemapOutput | undefined {
      return self.basemaps?.find((basemap) => basemap.id === self.shownBasemapId);
    },
    get displayedBasemap(): BasemapOutput | undefined {
      return self.draftBasemap ?? this.shownBasemap;
    },
    getLayerCapability(layer: LayerRasterRecordModelType): CapabilityModelType | undefined {
      const layerLink = getLayerLink(layer);
      return self.capabilities.find((capability) => capability.id === layerLink?.name);
    },
  }))
  .actions((self) => {
    const getBasemaps: () => Promise<void> = flow(
      function* getBasemaps() {
        try {
          self.state = ResponseState.PENDING;
          // TODO: MOCK should be replaced by actual API call
          const result: BasemapOutput[] = yield Promise.resolve(mockBasemaps);
          const layers = result.flatMap((basemap) =>
            basemap.layers.flatMap(({ source }) =>
              source.type === 'RESOLVED_CATALOG_RESOURCE' ? [source.layer] : []
            )
          );
          const capabilities: CapabilityModelType[] =
            yield self.root.catalogTreeStore.fetchLayersCapabilities(layers);
          self.capabilities = cloneDeep(capabilities);
          self.basemaps = result;
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

    const editBasemap = (id: string): void => {
      const basemap = self.basemaps?.find((item) => item.id === id);

      if (basemap) {
        self.editedBasemap = {...basemap};
      }
    };

    const exportBasemap = (id: string): void => {
      console.log(`EXPORT basemap ${id}`);
    };

    const makeDefaultBasemap = (id: string): void => {
      console.log(`MAKE DEFAULT basemap ${id}`);
    };

    const startDraft = (basemap?: BasemapOutput): void => {
      self.draftBasemap = cloneDeep(basemap) ?? {
        id: uuidv4(),
        name: '',
        thumbnail: { url: '', width: 128, height: 128 },
        isCurrent: false,
        isForPreview: false,
        layers: [],
      };
    };

    const clearDraft = (): void => {
      self.draftBasemap = undefined;
    };

    const updateDraft = (patch: Partial<Omit<BasemapOutput, 'id'>>): void => {
      if (self.draftBasemap) {
        self.draftBasemap = { ...self.draftBasemap, ...patch };
      }
    };

    const setDraftLayers = (layers: BasemapLayerOutput[]): void => {
      updateDraft({ layers });
    };

    // IDs are supplied bottom-first, matching Cesium's imagery collection.
    const syncDraftLayerOrder = (layerIds: string[]): void => {
      const layers = self.draftBasemap?.layers;
      if (layers === undefined) {
        return;
      }
      const orderedLayers = [...layers].sort((curr, next) => curr.order - next.order);
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

    // `fromIndex` / `toIndex` are positions in the top-first (descending `order`) list.
    const moveDraftLayer = (fromIndex: number, toIndex: number): void => {
      const topFirst = [...(self.draftBasemap?.layers ?? [])].sort(
        (curr, next) => next.order - curr.order
      );
      const [moved] = topFirst.splice(fromIndex, 1);
      if (moved === undefined) {
        return;
      }
      topFirst.splice(toIndex, 0, moved);
      setDraftLayers(
        topFirst.map((layer, index) => ({ ...layer, order: topFirst.length - 1 - index }))
      );
    };

    const addDraftLayers: (layers: LayerMetadataMixedUnion[]) => Promise<void> = flow(
      function* addDraftLayers(layers: LayerMetadataMixedUnion[]) {
        const rasterLayers = layers.filter(
          (layer) => layer.type === RecordType.RECORD_RASTER
        ) as LayerRasterRecordModelType[];
        if (rasterLayers.length === 0) {
          return;
        }
        try {
          const capabilities: CapabilityModelType[] =
            yield self.root.catalogTreeStore.fetchLayersCapabilities(rasterLayers);
          self.capabilities = [...self.capabilities, ...cloneDeep(capabilities)];
        } catch (error) {
          console.error(error);
        }
        const currentLayers = self.draftBasemap?.layers ?? [];
        const topOrder = currentLayers.reduce((max, layer) => Math.max(max, layer.order), -1);
        const newLayers: BasemapLayerOutput[] = rasterLayers.map((layer, index) => ({
          id: uuidv4(),
          order: topOrder + 1 + index,
          opacity: 1,
          source: {
            type: SourceTypeOutput.RESOLVED_CATALOG_RESOURCE,
            domain: Domain.RASTER,
            // plain JSON copy: `frozen` cannot hold MST nodes
            layer: JSON.parse(JSON.stringify(layer)) as LayerRasterRecordModelType,
          },
        }));
        setDraftLayers([...currentLayers, ...newLayers]);
      }
    );

    // TODO: MOCK should be replaced by actual API calls
    const saveBasemap = (): void => {
      console.log('SAVE basemap', self.draftBasemap?.id);
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
      editBasemap,
      exportBasemap,
      makeDefaultBasemap,
    };
  });
