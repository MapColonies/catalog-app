import { types, getParent, flow } from 'mobx-state-tree';
import { cloneDeep } from 'lodash';
import { ResponseState } from '../../common/models/response-state.enum';
import { ModelBase } from './ModelBase';
import { BasemapModelType } from './BasemapModel';
import { getLayerLink } from '../components/helpers/layersUtils';
import { CapabilityModelType } from './CapabilityModel';
import { LayerRasterRecordModelType } from './LayerRasterRecordModel';
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
    // TODO: this should be taken from the global store it shouldn't be here at all!
    basemaps: types.maybe(types.frozen<BasemapModelType[]>([])),
    capabilities: types.optional(types.frozen<CapabilityModelType[]>(), []),
    shownBasemapId: types.maybe(types.string),
    editedBasemap: types.maybe(types.frozen<BasemapModelType>()),
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
          const response: { basemaps: BasemapModelType[] } = yield self.root
            .queryBasemaps({}, BASEMAPS_QUERY_SELECTOR)
            .refetch();
          const result = response.basemaps;
          const layers = result.flatMap((basemap) =>
            (basemap.layers ?? []).flatMap(({ source }) =>
              source.type === 'CATALOG_RESOURCE' && source.status === 'RESOLVED' && source.layer != null
                ? [source.layer]
                : []
            )
          );
          const capabilities: CapabilityModelType[] =
            yield self.root.catalogTreeStore.fetchLayersCapabilities(layers);
          self.capabilities = cloneDeep(capabilities);
          self.basemaps = cloneDeep(result);
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
