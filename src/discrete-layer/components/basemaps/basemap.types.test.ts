import { Domain } from '../../../common/models/domain';
import { ProtocolType } from '../../../common/models/protocol-type.enum';
import { CapabilityModelType } from '../../models/CapabilityModel';
import { LayerRasterRecordModelType } from '../../models/LayerRasterRecordModel';
import { ProductType } from '../../models/ProductTypeEnum';
import {
  BasemapLayerOutput,
  BasemapOutput,
  ResolvedCatalogResourceLayerSourceOutput,
  SourceType,
  SourceTypeInput,
  Status,
  hasUnresolvedLayers,
  toBasemapLayerInput,
} from './basemap.types';

const RASTER_DOMAIN =
  Domain.RASTER as unknown as ResolvedCatalogResourceLayerSourceOutput['domain'];

const RECORD = {
  id: 'record-1',
  productId: 'prod-1',
  productType: ProductType.ORTHOPHOTO,
} as unknown as LayerRasterRecordModelType;
const CAPABILITIES = { id: 'prod-1-Orthophoto' } as unknown as CapabilityModelType;
const EXTERNAL_DETAILS = {
  protocol: ProtocolType.XYZ,
  name: 'osm',
  url: 'https://tiles/{z}/{x}/{y}.png',
  attribution: 'OSM',
};

const resolvedLayer: BasemapLayerOutput = {
  id: 'l1',
  order: 0,
  opacity: 0.5,
  shouldBeUsedInModelDraping: true,
  source: {
    type: SourceType.CATALOG_RESOURCE,
    domain: RASTER_DOMAIN,
    status: Status.RESOLVED,
    uniqueness: { productId: 'prod-1', productType: ProductType.ORTHOPHOTO },
    layer: RECORD,
    capabilities: CAPABILITIES,
  },
};
const unresolvedLayer: BasemapLayerOutput = {
  id: 'l2',
  order: 1,
  opacity: 1,
  source: {
    type: SourceType.CATALOG_RESOURCE,
    domain: RASTER_DOMAIN,
    status: Status.UNRESOLVED,
    uniqueness: { productId: 'gone', productType: ProductType.ORTHOPHOTO },
    layer: null,
    capabilities: null,
  },
};
const externalLayer: BasemapLayerOutput = {
  id: 'l3',
  order: 2,
  opacity: 1,
  source: { type: SourceType.EXTERNAL, status: Status.RESOLVED, details: EXTERNAL_DETAILS },
};

describe('toBasemapLayerInput', () => {
  it('saves a resolved catalog layer as a CATALOG_RESOURCE reference built from the record, without layer/capabilities', () => {
    expect(toBasemapLayerInput(resolvedLayer)).toEqual({
      id: 'l1',
      order: 0,
      opacity: 0.5,
      shouldBeUsedInModelDraping: true,
      source: {
        type: SourceTypeInput.CATALOG_RESOURCE,
        domain: Domain.RASTER,
        uniqueness: { productId: 'prod-1', productType: ProductType.ORTHOPHOTO },
      },
    });
  });

  it('saves an external layer with its details unchanged', () => {
    expect(toBasemapLayerInput(externalLayer).source).toEqual({
      type: SourceTypeInput.EXTERNAL,
      details: EXTERNAL_DETAILS,
    });
  });

  it('refuses to save an unresolved layer', () => {
    expect(() => toBasemapLayerInput(unresolvedLayer)).toThrow(/unresolved/);
  });

  it('refuses to save a resolved record missing productId', () => {
    const layer = {
      ...resolvedLayer,
      source: { ...resolvedLayer.source, layer: { ...RECORD, productId: null } },
    } as BasemapLayerOutput;

    expect(() => toBasemapLayerInput(layer)).toThrow(/productId/);
  });
});

describe('hasUnresolvedLayers', () => {
  const basemap = (layers: BasemapLayerOutput[]): BasemapOutput => ({
    id: 'b',
    name: 'b',
    thumbnail: { url: 'u', width: 128, height: 128 },
    isCurrent: false,
    isForPreview: false,
    layers,
  });

  it('is true only when an UNRESOLVED catalog resource layer is present', () => {
    expect(hasUnresolvedLayers(basemap([resolvedLayer, externalLayer]))).toBe(false);
    expect(hasUnresolvedLayers(basemap([resolvedLayer, unresolvedLayer]))).toBe(true);
  });
});
