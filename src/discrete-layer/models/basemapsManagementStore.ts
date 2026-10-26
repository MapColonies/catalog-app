import { types, getParent, flow } from 'mobx-state-tree';
import { cloneDeep } from 'lodash';
import { ResponseState } from '../../common/models/response-state.enum';
import { ModelBase } from './ModelBase';
import { BasemapOutput, mockBasemaps } from '../components/basemaps/XXXbasemapMockXXX';
import { getLayerLink } from '../components/helpers/layersUtils';
import { CapabilityModelType } from './CapabilityModel';
import { LayerRasterRecordModelType } from './LayerRasterRecordModel';
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
      const basemap = self.basemaps?.find(() => id);

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

    return {
      getBasemaps,
      showBasemap,
      editBasemap,
      exportBasemap,
      makeDefaultBasemap,
    };
  });
