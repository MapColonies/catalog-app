import { types, getParent, flow } from 'mobx-state-tree';
import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { ResponseState } from '../../common/models/response-state.enum';
import { ModelBase } from './ModelBase';
import { BasemapModelType } from './BasemapModel';
import { BasemapLayerInput } from './RootStore.base';
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
export const basemapsManagementStore = ModelBase
  .props({
    state: types.enumeration<ResponseState>(
      'State',
      Object.values(ResponseState)
    ),
    basemaps: types.maybe(types.frozen<BasemapModelType[]>([])),
    shownBasemapId: types.maybe(types.string),
    // Set while the composer is open. The layers being composed live on the map's `layersManager`, not here.
    composingBasemapId: types.maybe(types.string),
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
    get composingBasemap(): BasemapModelType | undefined {
      return self.basemaps?.find((basemap) => basemap.id === self.composingBasemapId);
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
            return { ...basemap, layers: [...(basemap.layers ?? [])] };
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

    // A new basemap (no `id`) gets a fresh id.
    const startComposing = (id?: string): void => {
      if (id !== undefined && self.basemaps?.find((basemap) => basemap.id === id) === undefined) {
        throw new Error(`Cannot start composing: basemap ${id} was not found`);
      }
      // the composer puts its own layers on the map, so the shown basemap must not stay on it
      self.shownBasemapId = undefined;
      self.composingBasemapId = id ?? uuidv4();
    };

    // Leaving the composer (cancel or save) leaves no basemap on the map.
    const stopComposing = (): void => {
      self.composingBasemapId = undefined;
      self.shownBasemapId = undefined;
    };

    const saveBasemap = async (
      details: Pick<BasemapModelType, 'name' | 'isCurrent' | 'isForPreview'>,
      layers: BasemapLayerInput[],
      thumbnail?: Blob
    ): Promise<void> => {
      if (self.composingBasemapId === undefined) {
        throw new Error('Cannot save a basemap that is not being composed');
      }
      const savedThumbnail = self.basemaps?.find((basemap) => {
        return basemap.id === self.composingBasemapId;
      })?.thumbnail;
      const input = {
        ...details,
        id: self.composingBasemapId,
        thumbnail: savedThumbnail ?? { url: '', width: 128, height: 128 },
        layers,
      };
      if (thumbnail !== undefined) {
        // TODO: Should be actual returned url.
        const url = 'https://placehold.co/128x128?text=OSM'; // await mockUploadBasemapThumbnail(thumbnail);
        input.thumbnail = { ...input.thumbnail, url };
      }
      console.log('SAVE basemap', input);
    };

    const exportComposedBasemap = (): void => {
      console.log('EXPORT composed basemap', self.composingBasemapId);
    };

    return {
      startComposing,
      stopComposing,
      saveBasemap,
      exportComposedBasemap,
      getBasemaps,
      toggleBasemap,
      exportBasemap,
      makeDefaultBasemap,
    };
  });
