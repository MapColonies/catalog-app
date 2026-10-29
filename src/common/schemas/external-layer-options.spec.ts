import { ImageryProtocolType, ProtocolType } from '../models/protocol-type.enum';
import {
  getOptionsSchema,
  hasOptionsSchema,
  SUPPORTED_EXTERNAL_LAYER_TYPES,
  getMandatoryKeys,
  getModeKeys,
  mergeOptionsByMode,
  pickOptionsByMode,
  validateOptionsTextByMode,
  getMonacoSchemaEntry,
  getOptionsJsonSchema,
  validateOptionalOptionsText,
  validateOptionsText,
} from './external-layer-options';

const wmts = {
  url: 'https://example.com/wmts/{TileMatrix}/{TileRow}/{TileCol}.png',
  layer: 'ortho',
  style: 'default',
  tileMatrixSetID: 'WGS84',
};

describe('external layer options schemas', () => {
  it('validates editor text and applies defaults', () => {
    const result = validateOptionsText('WMTS', JSON.stringify(wmts));
    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({ format: 'image/jpeg', tileWidth: 256 }),
    });
  });

  it('reports issues with their paths', () => {
    const result = validateOptionsText(
      'WMTS',
      JSON.stringify({
        ...wmts,
        layer: '',
        typo: 1,
        rectangle: { west: -999, south: 0, east: 0, north: 0 },
      })
    );
    expect(result.success).toBe(false);
    const paths = result.success ? [] : result.issues.map((i) => i.path);
    expect(paths).toEqual(expect.arrayContaining(['layer', 'rectangle.west']));
  });

  it('reports broken JSON', () => {
    expect(validateOptionsText('WMTS', '{ nope')).toEqual({
      success: false,
      issues: [{ path: '', message: expect.stringContaining('Invalid JSON') }],
    });
  });

  it('rejects credentials in url unless explicitly allowed', () => {
    const text = JSON.stringify({ ...wmts, url: 'https://user:pw@example.com/wmts?token=abc' });
    expect(validateOptionsText('WMTS', text).success).toBe(false);
    expect(validateOptionsText('WMTS', text, { allowUrlCredentials: true }).success).toBe(true);
  });

  it('produces a strict JSON Schema and a Monaco entry', () => {
    expect(getOptionsJsonSchema('WMTS')).toEqual(
      expect.objectContaining({
        additionalProperties: false,
        required: expect.arrayContaining(['url', 'layer']),
      })
    );
    const entry = getMonacoSchemaEntry('WMTS');
    expect(entry.fileMatch).toEqual(['inmemory://models/external-layer/WMTS.full.json']);
    expect(entry.schema).toBeDefined();
  });

  describe('optional (non-mandatory) mode', () => {
    const { url, layer, style, tileMatrixSetID } = wmts;
    const mandatory = { url, layer, style, tileMatrixSetID };

    it('derives mandatory keys from the schema', () => {
      expect(getMandatoryKeys('WMTS').sort()).toEqual(['layer', 'style', 'tileMatrixSetID', 'url']);
    });

    it('exposes only non-mandatory fields, still strict', () => {
      const full = getOptionsJsonSchema('WMTS') as any;
      const optional = getOptionsJsonSchema('WMTS', undefined, 'optional') as any;
      expect(Object.keys(optional.properties)).not.toEqual(expect.arrayContaining(['url']));
      expect(Object.keys(optional.properties)).toEqual(
        expect.arrayContaining(['format', 'rectangle', 'maximumLevel'])
      );
      expect(optional.required).toBeUndefined();
      expect(optional.additionalProperties).toBe(false);
      expect(Object.keys(optional.properties).length).toBe(Object.keys(full.properties).length - 4);
    });

    it('registers full and optional entries under different URIs', () => {
      expect(getMonacoSchemaEntry('WMTS').uri).not.toBe(
        getMonacoSchemaEntry('WMTS', undefined, 'optional').uri
      );
    });

    it('validates optional text merged with the mandatory part', () => {
      expect(validateOptionalOptionsText('WMTS', '{"maximumLevel": 18}', mandatory).success).toBe(
        true
      );
      expect(
        validateOptionalOptionsText('WMTS', '{"minimumLevel": 5, "maximumLevel": 2}', mandatory)
          .success
      ).toBe(false);
      expect(validateOptionalOptionsText('WMTS', '{}', mandatory).success).toBe(true);
    });

    it('rejects mandatory keys inside the optional editor', () => {
      expect(validateOptionalOptionsText('WMTS', '{"layer": "x"}', mandatory)).toEqual({
        success: false,
        issues: [{ path: 'layer', message: expect.any(String) }],
      });
    });
  });

  describe('mandatory mode', () => {
    const optionalPart = { format: 'image/png', maximumLevel: 12 };

    it('exposes only mandatory fields, all required, still strict', () => {
      const schema = getOptionsJsonSchema('WMTS', undefined, 'mandatory') as any;
      expect(Object.keys(schema.properties).sort()).toEqual([
        'layer',
        'style',
        'tileMatrixSetID',
        'url',
      ]);
      expect(schema.required.sort()).toEqual(['layer', 'style', 'tileMatrixSetID', 'url']);
      expect(schema.additionalProperties).toBe(false);
    });

    it('the three modes partition the fields', () => {
      const full = getModeKeys('WMTS', 'full').sort();
      const parts = [
        ...getModeKeys('WMTS', 'mandatory'),
        ...getModeKeys('WMTS', 'optional'),
      ].sort();
      expect(parts).toEqual(full);
    });

    it('validates mandatory text merged with the optional part', () => {
      expect(
        validateOptionsTextByMode('WMTS', JSON.stringify(wmts), 'mandatory', optionalPart).success
      ).toBe(true);
      expect(
        validateOptionsTextByMode(
          'WMTS',
          JSON.stringify({ ...wmts, layer: '' }),
          'mandatory',
          optionalPart
        ).success
      ).toBe(false);
    });

    it('rejects optional keys inside the mandatory editor', () => {
      const result = validateOptionsTextByMode(
        'WMTS',
        JSON.stringify({ ...wmts, format: 'x' }),
        'mandatory',
        {}
      );
      expect(result).toEqual({
        success: false,
        issues: [{ path: 'format', message: expect.any(String) }],
      });
    });

    it('picks and merges a mode without losing the other group', () => {
      const all = { ...wmts, ...optionalPart };
      expect(pickOptionsByMode('WMTS', all, 'mandatory')).toEqual(wmts);
      expect(pickOptionsByMode('WMTS', all, 'optional')).toEqual(optionalPart);
      expect(mergeOptionsByMode('WMTS', all, { ...wmts, layer: 'new' }, 'mandatory')).toEqual({
        ...all,
        layer: 'new',
      });
      expect(mergeOptionsByMode('WMTS', all, {}, 'optional')).toEqual(wmts);
    });
  });

  describe('imagery protocol types', () => {
    it('is the imagery subset of ProtocolType', () => {
      expect(Object.keys(ImageryProtocolType).sort()).toEqual([
        'BING_MAPS',
        'MAPBOX_STYLE',
        'OSM',
        'WCS',
        'WMS',
        'WMTS',
        'XYZ',
      ]);
      Object.values(ImageryProtocolType).forEach((value) =>
        expect(Object.values(ProtocolType)).toContain(value)
      );
    });

    it('has schemas for WMTS, WMS and XYZ so far, and fails clearly for the rest', () => {
      expect([...SUPPORTED_EXTERNAL_LAYER_TYPES].sort()).toEqual(['WMS', 'WMTS', 'XYZ']);
      expect(hasOptionsSchema(ImageryProtocolType.WMS)).toBe(true);
      expect(hasOptionsSchema(ImageryProtocolType.OSM)).toBe(false);
      expect(() => getOptionsSchema(ImageryProtocolType.OSM)).toThrow(/No options schema/);
    });
  });

  describe.each([
    [ImageryProtocolType.WMS, { url: 'https://example.com/wms?', layers: 'a' }, ['layers', 'url']],
    [ImageryProtocolType.XYZ, { url: 'https://example.com/{z}/{x}/{y}.png' }, ['url']],
  ] as const)('%s through the registry', (type, mandatoryValues, mandatoryKeys) => {
    it('validates, derives mandatory keys and exposes all three modes', () => {
      expect(validateOptionsText(type, JSON.stringify(mandatoryValues)).success).toBe(true);
      expect(
        validateOptionsText(type, JSON.stringify({ ...mandatoryValues, typo: 1 })).success
      ).toBe(false);
      expect([...getMandatoryKeys(type)].sort()).toEqual([...mandatoryKeys]);
      const full = getModeKeys(type, 'full').sort();
      expect([...getModeKeys(type, 'mandatory'), ...getModeKeys(type, 'optional')].sort()).toEqual(
        full
      );
      expect(getMonacoSchemaEntry(type, undefined, 'optional').fileMatch).toEqual([
        `inmemory://models/external-layer/${type}.optional.json`,
      ]);
    });

    it('validates optional text merged with the mandatory part, and honours the credentials opt-in', () => {
      expect(
        validateOptionalOptionsText(type, '{"maximumLevel": 9}', mandatoryValues).success
      ).toBe(true);
      const withToken = {
        ...mandatoryValues,
        url: 'https://example.com/{z}/{x}/{y}.png?token=abc',
      };
      expect(validateOptionsText(type, JSON.stringify(withToken)).success).toBe(false);
      expect(
        validateOptionsText(type, JSON.stringify(withToken), { allowUrlCredentials: true }).success
      ).toBe(true);
    });
  });
});
