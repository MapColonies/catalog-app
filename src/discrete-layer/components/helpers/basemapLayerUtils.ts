import { IRasterLayer } from '@map-colonies/react-components';
import { LinkType } from '../../../common/models/link-type.enum';
import { CapabilityModelType } from '../../models';
import { BasemapLayerOutput } from '../basemaps/XXXbasemapMockXXX';
import { getCesiumWMTSOptions } from './cesiumUtils';
import { getLayerLink } from './layersUtils';

export const buildRasterLayerFromBasemapLayer = (
  basemapLayer: BasemapLayerOutput,
  capabilities: CapabilityModelType[] = []
): IRasterLayer | undefined => {
  const { id, order, opacity, shouldBeUsedInModelDraping, source } = basemapLayer;

  if (source.type === 'EXTERNAL') {
    const { protocol, url, ...rest } = source.details;

    if (protocol === LinkType.XYZ_LAYER) {
      return {
        id,
        type: LinkType.XYZ_LAYER,
        opacity,
        zIndex: order,
        show: true,
        shouldBeUsedInModelDraping,
        options: { url },
      };
    }

    if (protocol === LinkType.WMTS_LAYER) {
      return {
        id,
        type: LinkType.WMTS_LAYER,
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

  const record = source.layer;
  const link = getLayerLink(record);
  if (link === undefined) {
    return undefined;
  }

  if (link.protocol === LinkType.WMTS_LAYER || link.protocol === LinkType.WMTS) {
    const capability = capabilities.find((item) => item.id === link.name);
    return {
      id,
      type: LinkType.WMTS_LAYER,
      opacity,
      zIndex: order,
      show: true,
      shouldBeUsedInModelDraping,
      options: getCesiumWMTSOptions(record, link.url as string, capability),
    };
  }

  if (link.protocol === LinkType.WMS) {
    return {
      id,
      type: 'WMS_LAYER',
      opacity,
      zIndex: order,
      show: true,
      shouldBeUsedInModelDraping,
      options: { url: link.url as string, layers: record.productId as string },
    };
  }

  return undefined;
};
