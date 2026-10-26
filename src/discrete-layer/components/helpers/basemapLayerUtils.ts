import { IRasterLayer } from '@map-colonies/react-components';
import { ProtocolType } from '../../../common/models/protocol-type.enum';
import { LinkType } from '../../../common/models/link-type.enum';
import { CapabilityModelType, LayerRasterRecordModelType } from '../../models';
import { BasemapLayerOutput } from '../basemaps/XXXbasemapMockXXX';
import { generateLayerRectangle, getCesiumWMTSOptions } from './cesiumUtils';
import { getLayerLink } from './layersUtils';

export const buildRasterLayerFromBasemapLayer = (
  basemapLayer: BasemapLayerOutput,
  capability?: CapabilityModelType
): IRasterLayer | undefined => {
  const { id, order, opacity, shouldBeUsedInModelDraping, source } = basemapLayer;

  if (source.type === 'EXTERNAL') {
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

  if (source.type === 'UNRESOLVED_CATALOG_RESOURCE') {
    throw 'Unhandled unresolved catalog resource';
  }

  const record = source.layer;
  const link = getLayerLink(record);
  if (link === undefined) {
    return undefined;
  }

  if (link.protocol === LinkType.WMTS) {
    return {
      id,
      type: ProtocolType.WMTS,
      opacity,
      zIndex: order,
      show: true,
      shouldBeUsedInModelDraping,
      options: {
        ...getCesiumWMTSOptions(record, link.url as string, capability),
        rectangle: generateLayerRectangle(record as LayerRasterRecordModelType),
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
