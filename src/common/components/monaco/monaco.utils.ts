// Subset of mc-web-tools `GeoJsonViewer/Utils/GeoJsonViewer/utils.ts` needed by the Monaco editors.
export const FEATURE_ID_FIELD = 'id';

export const MONACO_ROW_NUMBER_COLUMN = 1;

export enum HighlightMode {
  HOVER_ON_KEY_FIELD = 'HOVER_ON_KEY_FIELD',
  HOVER_ON_FEATTURE = 'HOVER_ON_FEATTURE',
}

export const formatJson = (json: Record<string, unknown>): string => JSON.stringify(json, null, 2);
