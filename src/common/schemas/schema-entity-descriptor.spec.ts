import { ImageryProtocolType } from '../models/protocol-type.enum';
import {
  getMandatoryEntityDescriptors,
  getMandatoryInitialValues,
  mandatoryValuesToOptions,
  validateOptionsForm,
} from './schema-entity-descriptor';

const WMTS = ImageryProtocolType.WMTS;
const valid = {
  url: 'https://example.com/wmts',
  layer: 'ortho',
  style: 'default',
  tileMatrixSetID: 'EPSG:4326',
};

describe('schema -> entity descriptor bridge', () => {
  it('builds UiDescriptors fields from the mandatory options only', () => {
    const [descriptor] = getMandatoryEntityDescriptors(WMTS) as any[];
    expect(descriptor.type).toBe('UiDescriptors');
    const fields = descriptor.categories[0].fields;
    expect(fields.map((f: any) => f.fieldName).sort()).toEqual(
      ['layer', 'style', 'tileMatrixSetID', 'url'].sort()
    );
    expect(fields.every((f: any) => f.isRequired && f.uiDescriptorFieldType === 'string')).toBe(
      true
    );
    expect(fields.every((f: any) => f.__typename === 'UiDescriptors')).toBe(true);
    expect(fields.find((f: any) => f.fieldName === 'url').label).toBe('basemaps.options.field.url');
  });

  it('gives empty initial values and drops empty inputs', () => {
    expect(getMandatoryInitialValues(WMTS)).toEqual({
      url: '',
      layer: '',
      style: '',
      tileMatrixSetID: '',
    });
    expect(mandatoryValuesToOptions(WMTS, { ...valid, style: ' ' })).not.toHaveProperty('style');
  });

  it('merges inputs and optional JSON, and accepts a valid combination', () => {
    const result = validateOptionsForm(WMTS, valid, '{"maximumLevel": 12}');
    expect(result.valid).toBe(true);
    expect(result.options).toMatchObject({ ...valid, maximumLevel: 12 });
  });

  it('routes issues to the input or to the editor', () => {
    const result = validateOptionsForm(WMTS, { ...valid, url: '' }, '{"maximumLevel": "x"}');
    expect(result.valid).toBe(false);
    expect(Object.keys(result.fieldIssues)).toContain('url');
    expect(result.editorIssues.some((i) => i.path === 'maximumLevel')).toBe(true);
  });

  it('rejects mandatory keys typed into the optional editor and invalid JSON', () => {
    const misplaced = validateOptionsForm(WMTS, valid, '{"layer": "other"}');
    expect(misplaced.valid).toBe(false);
    expect(misplaced.editorIssues[0].path).toBe('layer');
    expect(validateOptionsForm(WMTS, valid, '{').editorIssues[0].message).toMatch(/Invalid JSON/);
  });
});
