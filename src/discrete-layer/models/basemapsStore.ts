import { types, getParent, flow } from 'mobx-state-tree';
import { ResponseState } from '../../common/models/response-state.enum';
import { ModelBase } from './ModelBase';
import { BasemapOutput, mockBasemaps } from '../components/basemaps/XXXbasemapMockXXX';
import { IRootStore, RootStoreType } from './RootStore';

export const basemapsStore = ModelBase
  .props({
    state: types.enumeration<ResponseState>(
      'State',
      Object.values(ResponseState)
    ),
    basemaps: types.maybe(types.frozen<BasemapOutput[]>([])),
    shownBasemapId: types.maybe(types.string),
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
  }))
  .actions((self) => {
    const getBasemaps: () => Promise<void> = flow(
      function* getBasemaps(): Generator<Promise<BasemapOutput[]>, void, BasemapOutput[]> {
        try {
          self.state = ResponseState.PENDING;
          // TODO: MOCK should be replaced by actual API call
          const result = yield Promise.resolve(mockBasemaps);
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

    // TODO: these are placeholders until the real basemap management API lands
    const editBasemap = (id: string): void => {
      console.log(`EDIT basemap ${id}`);
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
