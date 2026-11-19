import { IBaseMaps, IRasterLayer } from '@map-colonies/react-components';
import { omitDeep } from '../../../common/helpers/object';
import { ProtocolType } from '../../../common/models/protocol-type.enum';
import { LinkType } from '../../../common/models/link-type.enum';
import { LayerRasterRecordModelType } from '../../models';
import { BasemapLayerModelType } from '../../models/BasemapLayerModel';
import { BasemapModelType } from '../../models/BasemapModel';
import { ResourceResolutionStatus } from '../../models/ResourceResolutionStatusEnum';
import { buildRasterLayerFromRecord, getTokenParam } from './layersUtils';

type ResolvedCatalogResourceSource = Extract<
  NonNullable<BasemapLayerModelType['source']>,
  { __typename: 'CatalogResourceSource' }
> & { layer: LayerRasterRecordModelType };

export const isResolvedCatalogSource = (
  source: BasemapLayerModelType['source']
): source is ResolvedCatalogResourceSource =>
  source?.__typename === 'CatalogResourceSource' &&
  source.status === ResourceResolutionStatus.RESOLVED &&
  source.layer != null;

export const isCatalogSource = (source?: BasemapLayerModelType['source']): boolean => {
  return source && source.__typename === 'CatalogResourceSource';
};

export const isExternalSource = (source?: BasemapLayerModelType['source']): boolean => {
  return source && source.__typename === 'ExternalLayerSource';
};

export const buildRasterLayerFromBasemapLayer = (
  basemapLayer: BasemapLayerModelType
): IRasterLayer | undefined => {
  // `id`/`order`/`opacity` are non-nullable in the GraphQL schema, and `shouldBeUsedInModelDraping` is
  // selected explicitly - mst-gql still types every field as possibly-undefined (its generic generated
  // defensive typing), so these are narrowed once here rather than cast at every return below.
  const { source } = basemapLayer;
  const id = basemapLayer.id as string;
  const order = basemapLayer.order as number;
  const opacity = basemapLayer.opacity as number;
  const shouldBeUsedInModelDraping = basemapLayer.shouldBeUsedInModelDraping ?? undefined;

  if (isExternalSource(source)) {
    // `name` is only a display name and `matrixSet` the legacy name of `tileMatrixSetID`, the rest are the layer options as they are.
    // The generated `ExternalLayerDetails` type only declares `protocol`/`name`/`url` - widen to allow the extra WMTS/XYZ option fields
    // (`matrixSet`, `layer`, `style`, `format`, `credit`, ...) that aren't part of the GraphQL schema yet. `details` can itself carry a
    // `__typename` (and so could any of those extra fields, were they ever objects), so strip recursively before it's spread into `options`.
    const details = omitDeep(source.details ?? {}, ['__typename']) as {
      protocol?: string;
      name?: string;
      url?: string;
    } & Record<string, unknown>;
    const { protocol, name, matrixSet, ...rest } = details;

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
          url: rest.url as string,
        },
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
          tileMatrixSetID: matrixSet as string,
          style: (rest.style as string | undefined) ?? 'default',
          format: (rest.format as string | undefined) ?? 'image/png',
        },
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
