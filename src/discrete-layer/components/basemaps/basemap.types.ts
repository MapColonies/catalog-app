import {
  SourceType,
  SourceType as SourceTypeInput,
  ResourceResolutionStatus as Status,
} from '@map-colonies/types';
import type {
  Basemap as SharedBasemap,
  BasemapLayerOutput as SharedBasemapLayerOutput,
  BasemapLayerSourceOutput as SharedBasemapLayerSourceOutput,
  BasemapLayerInput as SharedBasemapLayerInput,
  BasemapWriteInput as SharedBasemapWriteInput,
  ResolvedCatalogResourceLayerSource,
  UnresolvedCatalogResourceLayerSource,
  ExternalLayerSourceOutput as SharedExternalLayerSourceOutput,
} from '@map-colonies/types';
import { Domain } from '../../../common/models/domain';
import { CapabilityModelType } from '../../models/CapabilityModel';
import { LayerRasterRecordModelType } from '../../models/LayerRasterRecordModel';
import { ProductType } from '../../models/ProductTypeEnum';

export { SourceType, SourceTypeInput, Status };

export type ResolvedCatalogResourceLayerSourceOutput = ResolvedCatalogResourceLayerSource<
  LayerRasterRecordModelType,
  CapabilityModelType
>;
export type UnresolvedCatalogResourceLayerSourceOutput = UnresolvedCatalogResourceLayerSource;
export type ExternalLayerSourceOutput = SharedExternalLayerSourceOutput;

export type BasemapLayerSourceOutput = SharedBasemapLayerSourceOutput<
  LayerRasterRecordModelType,
  CapabilityModelType
>;
export type BasemapLayerOutput = SharedBasemapLayerOutput<
  LayerRasterRecordModelType,
  CapabilityModelType
>;
export type BasemapOutput = SharedBasemap<LayerRasterRecordModelType, CapabilityModelType>;

export type BasemapLayerInput = SharedBasemapLayerInput;
export type BasemapInput = SharedBasemapWriteInput & { id: string };

export const hasUnresolvedLayers = (basemap: BasemapOutput): boolean =>
  basemap.layers.some(
    ({ source }) =>
      source.type === SourceType.CATALOG_RESOURCE && source.status === Status.UNRESOLVED
  );

export const toBasemapLayerInput = (layer: BasemapLayerOutput): BasemapLayerInput => {
  const { source, ...base } = layer;

  if (source.type === SourceType.EXTERNAL) {
    return { ...base, source: { type: SourceType.EXTERNAL, details: source.details } };
  }

  if (source.status === Status.UNRESOLVED) {
    throw new Error(
      `Basemap layer "${layer.id}" is unresolved and must be resolved or removed before saving`
    );
  }

  const { productId, productType } = source.layer;
  if (!productId || !productType) {
    throw new Error(
      `Basemap layer "${layer.id}" has a catalog record without productId/productType`
    );
  }
  return {
    ...base,
    source: {
      type: SourceType.CATALOG_RESOURCE,
      domain: Domain.RASTER as unknown as typeof source.domain,
      uniqueness: { productId, productType: productType as ProductType },
    },
  };
};
