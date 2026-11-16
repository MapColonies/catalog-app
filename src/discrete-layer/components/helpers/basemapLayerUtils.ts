import { IBaseMaps, IRasterLayer } from '@map-colonies/react-components';
import { ProtocolType, toProtocol } from '../../../common/models/protocol-type.enum';
import { LinkType } from '../../../common/models/link-type.enum';
import { CapabilityModelType, LayerRasterRecordModelType } from '../../models';
import {
  BasemapLayerOutput,
  BasemapOutput,
  SourceType,
  Status,
} from '../basemaps/XXXbasemapMockXXX';
import { generateLayerRectangleDeg } from './cesiumUtils';
import { getLayerLink, getTokenParam, getWMTSConfigOptions } from './layersUtils';

type ResolvedCatalogSource = Extract<
  BasemapLayerOutput['source'],
  { type: SourceType.CATALOG_RESOURCE }
> & { status: Status.RESOLVED; layer: LayerRasterRecordModelType };

export const isResolvedCatalogSource = (
  source: BasemapLayerOutput['source']
): source is ResolvedCatalogSource =>
  source.type === SourceType.CATALOG_RESOURCE &&
  source.status === Status.RESOLVED &&
  source.layer !== null;

type RasterLayerProps = Pick<
  IRasterLayer,
  'id' | 'opacity' | 'zIndex' | 'shouldBeUsedInModelDraping'
>;

export const buildRasterLayerFromRecord = (
  record: LayerRasterRecordModelType,
  capability: CapabilityModelType | null | undefined,
  layerProps: RasterLayerProps
): IRasterLayer | undefined => {
  const link = getLayerLink(record);
  if (link?.url === undefined) {
    return undefined;
  }

  const base = { ...layerProps, show: true, tilingScheme: 'geographic' };
  const rectangle = generateLayerRectangleDeg(record);

  switch (toProtocol(link.protocol)) {
    case ProtocolType.WMTS:
      // Without the capability the tile matrix set is unknown: the layer url must not be used instead
      return !capability
        ? undefined
        : {
            ...base,
            type: ProtocolType.WMTS,
            options: { ...getWMTSConfigOptions(record, capability, link.url), rectangle },
          };

    case ProtocolType.WMS:
      return {
        ...base,
        type: ProtocolType.WMS,
        options: { url: link.url, layers: record.productId as string, rectangle },
      };

    case ProtocolType.XYZ:
      return { ...base, type: ProtocolType.XYZ, options: { url: link.url, rectangle } };

    default:
      return undefined;
  }
};

export const buildRasterLayerFromBasemapLayer = (
  basemapLayer: BasemapLayerOutput
): IRasterLayer | undefined => {
  const { id, order, opacity, shouldBeUsedInModelDraping, source } = basemapLayer;

  if (source.type === SourceType.EXTERNAL) {
    // `name` is only a display name and `matrixSet` the legacy name of `tileMatrixSetID`, the rest are the layer options as they are
    const { protocol, name, matrixSet, ...rest } = source.details;

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
          tilingScheme: 'geographic',
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
          layer: rest.layer as string,
          style: (rest.style as string | undefined) ?? 'default',
          format: (rest.format as string | undefined) ?? 'image/png',
          tilingScheme: 'geographic',
          tileMatrixSetID:
            (rest.tileMatrixSetID as string | undefined) ??
            (matrixSet as string | undefined) ??
            'EPSG:3857',
        },
      };
    }

    return undefined;
  }

  if (source.status === Status.UNRESOLVED) {
    // TODO: Should handle unresolved catalog layer
    return;
  }

  if (source.layer === null) {
    return undefined;
  }

  return buildRasterLayerFromRecord(source.layer, source.capabilities, {
    id,
    opacity,
    zIndex: order,
    shouldBeUsedInModelDraping,
  });
};

/** The only place `IBaseMaps` is built: it is the shape the Cesium/OL map components take, the app itself works with `BasemapOutput`. */
export const toIBaseMaps = (basemaps: BasemapOutput[] | undefined): IBaseMaps => ({
  maps: (basemaps ?? []).map((basemap) => ({
    id: basemap.id,
    title: basemap.name,
    thumbnail: basemap.thumbnail.url ? `${basemap.thumbnail.url}${getTokenParam()}` : undefined,
    isCurrent: basemap.isCurrent,
    isForPreview: basemap.isForPreview,
    baseRasterLayers: basemap.layers
      .map((layer) => buildRasterLayerFromBasemapLayer(layer))
      .filter((layer): layer is IRasterLayer => layer !== undefined),
  })),
});
