import { IBaseMaps, IRasterLayer } from '@map-colonies/react-components';
import { adaptCapabilityToWmtsOptions } from '@map-colonies/react-components/bridge';
import { ProtocolType } from '../../../common/models/protocol-type.enum';
import { LinkType } from '../../../common/models/link-type.enum';
import { CapabilityModelType, LayerRasterRecordModelType } from '../../models';
import {
  BasemapLayerOutput,
  BasemapOutput,
  SourceType,
  Status,
} from '../basemaps/XXXbasemapMockXXX';
import { generateLayerRectangle, generateLayerRectangleDeg, getTokenResource } from './cesiumUtils';
import { getLayerLink, getTokenParam, toAdapterCapability } from './layersUtils';

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

export const buildRasterLayerFromBasemapLayer = (
  basemapLayer: BasemapLayerOutput
): IRasterLayer | undefined => {
  const { id, order, opacity, shouldBeUsedInModelDraping, source } = basemapLayer;

  if (source.type === SourceType.EXTERNAL) {
    const { protocol, url, ...rest } = source.details;

    if (protocol === LinkType.XYZ) {
      return {
        id,
        type: ProtocolType.XYZ,
        opacity,
        zIndex: order,
        show: true,
        shouldBeUsedInModelDraping,
        options: { url },
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
        options: {
          url,
          layer: rest.layer as string,
          style: (rest.style as string | undefined) ?? 'default',
          format: (rest.format as string | undefined) ?? 'image/png',
          tileMatrixSetID: (rest.matrixSet as string | undefined) ?? 'EPSG:3857',
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

  const record = source.layer;
  const link = getLayerLink(record);
  if (link === undefined) {
    return undefined;
  }

  if (link.protocol === LinkType.WMTS) {
    const options = adaptCapabilityToWmtsOptions(
      toAdapterCapability(source.capabilities as CapabilityModelType)
    );

    return {
      id,
      type: ProtocolType.WMTS,
      opacity,
      zIndex: order,
      show: true,
      shouldBeUsedInModelDraping,
      options: {
        ...options,
        url: getTokenResource(options.url).url,
        tilingScheme: 'geographic',
        rectangle: generateLayerRectangleDeg(record),
      },
    };
  }

  if (link.protocol === LinkType.WMS) {
    return {
      id,
      type: ProtocolType.WMS,
      opacity,
      zIndex: order,
      show: true,
      shouldBeUsedInModelDraping,
      options: {
        url: link.url as string,
        layers: record.productId as string,
        rectangle: generateLayerRectangle(record as LayerRasterRecordModelType),
      },
    };
  }

  return undefined;
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
      .map(buildRasterLayerFromBasemapLayer)
      .filter((layer): layer is IRasterLayer => layer !== undefined),
  })),
});
