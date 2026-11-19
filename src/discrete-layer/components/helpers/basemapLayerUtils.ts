import { IBaseMaps, IRasterLayer } from '@map-colonies/react-components';
import { ProtocolType } from '../../../common/models/protocol-type.enum';
import { LinkType } from '../../../common/models/link-type.enum';
import { LayerRasterRecordModelType, SourceType } from '../../models';
import { BasemapLayerModelType } from '../../models/BasemapLayerModel';
import { BasemapModelType } from '../../models/BasemapModel';
import { CatalogResourceSourceModelType } from '../../models/CatalogResourceSourceModel';
import { ExternalLayerDetailsModelType } from '../../models/ExternalLayerDetailsModel';
import { ExternalLayerSourceModelType } from '../../models/ExternalLayerSourceModel';
import { ResourceResolutionStatus } from '../../models/ResourceResolutionStatusEnum';
import { buildRasterLayerFromRecord, getTokenParam } from './layersUtils';
import { WmtsOptionsInput, XyzOptionsInput } from '@map-colonies/react-components/dist/schemas';
import { omitDeep } from '../../../common/helpers/object';

// mst-gql generates `source` as `any` (union members are wrapped in `types.late((): any => ...)`), so the real union is spelled out here.
export type BasemapLayerSource = CatalogResourceSourceModelType | ExternalLayerSourceModelType;

type ResolvedCatalogResourceSource = CatalogResourceSourceModelType & {
  layer: LayerRasterRecordModelType;
};

export const isResolvedCatalogSource = (
  source?: BasemapLayerSource
): source is ResolvedCatalogResourceSource =>
  source?.__typename === 'CatalogResourceSource' &&
  source.status === ResourceResolutionStatus.RESOLVED &&
  source.layer != null;

export const isCatalogSource = (
  source?: BasemapLayerSource
): source is CatalogResourceSourceModelType => source?.type === SourceType.CATALOG_RESOURCE;

export const isExternalSource = (
  source?: BasemapLayerSource
): source is ExternalLayerSourceModelType => source?.type === SourceType.EXTERNAL;

export const buildRasterLayerFromBasemapLayer = (
  basemapLayer: BasemapLayerModelType
): IRasterLayer | undefined => {
  // `id`/`order`/`opacity` are non-nullable in the GraphQL schema, and `shouldBeUsedInModelDraping` is
  // selected explicitly - mst-gql still types every field as possibly-undefined (its generic generated
  // defensive typing), so these are narrowed once here rather than cast at every return below.
  const source = basemapLayer.source as BasemapLayerSource | undefined;
  const id = basemapLayer.id as string;
  const order = basemapLayer.order as number;
  const opacity = basemapLayer.opacity as number;
  const shouldBeUsedInModelDraping = basemapLayer.shouldBeUsedInModelDraping ?? undefined;

  if (isExternalSource(source)) {
    // `name` is only a display name and `matrixSet` the legacy name of `tileMatrixSetID`, the rest are the layer options as they are.
    // The generated `ExternalLayerDetails` type only declares `protocol`/`name`/`url` - widen to allow the extra WMTS/XYZ option fields
    // (`matrixSet`, `layer`, `style`, `format`, `credit`, ...) that aren't part of the GraphQL schema yet. `details` can itself carry a
    // `__typename` (and so could any of those extra fields, were they ever objects), so strip recursively before it's spread into `options`.
    const rawDetails: Partial<ExternalLayerDetailsModelType> = source.details ?? {};
    const details = omitDeep(rawDetails, ['__typename']) as Pick<
      ExternalLayerDetailsModelType,
      'protocol' | 'name' | 'url'
    > &
      Record<string, unknown>;
    const { protocol, name, url, ...rest } = details;

    if (protocol === LinkType.XYZ) {
      return {
        id,
        type: ProtocolType.XYZ,
        opacity,
        zIndex: order,
        show: true,
        shouldBeUsedInModelDraping,
        noAuth: true,
        options: {
          ...rest,
          url: url as string,
        } satisfies XyzOptionsInput,
      };
    }

    if (protocol === LinkType.WMTS) {
      return {
        id,
        type: ProtocolType.WMTS,
        opacity,
        zIndex: order,
        show: true,
        shouldBeUsedInModelDraping,
        noAuth: true,
        options: {
          ...rest,
          url: rest.url as string,
          layer: rest.layer as string,
          style: (rest.style as string | undefined) ?? 'default',
          format: (rest.format as string | undefined) ?? 'image/png',
          tileMatrixSetID:
            (rest.tileMatrixSetID as string | undefined) ?? 'XXX_DEFAULT_tileMatrixSetID_XXX',
        } satisfies WmtsOptionsInput,
      };
    }

    return undefined;
  }

  if (!isResolvedCatalogSource(source)) {
    // TODO: Should handle unresolved catalog layer
    return undefined;
  }

  // `buildRasterLayerFromRecord` strips `__typename` recursively from `record` itself; `source.layer` is passed through as-is.
  return buildRasterLayerFromRecord(source.layer, source.capabilities, {
    opacity,
    zIndex: order,
    shouldBeUsedInModelDraping,
  });
};

/** The only place `IBaseMaps` is built: it is the shape the Cesium/OL map components take, the app itself works with `BasemapModelType`. */
export const toIBaseMaps = (basemaps: BasemapModelType[] | undefined): IBaseMaps => ({
  maps: (basemaps ?? []).map((basemap) => ({
    id: basemap.id,
    title: basemap.name,
    thumbnail: basemap.thumbnail?.url ? `${basemap.thumbnail.url}${getTokenParam()}` : undefined,
    isCurrent: basemap.isCurrent,
    isForPreview: basemap.isForPreview,
    baseRasterLayers: (basemap.layers ?? [])
      .map((layer) => buildRasterLayerFromBasemapLayer(layer))
      .filter((layer): layer is IRasterLayer => layer !== undefined),
  })),
});
