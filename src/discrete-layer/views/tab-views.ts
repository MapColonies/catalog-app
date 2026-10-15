export enum TabViews {
  CATALOG,
  SEARCH_RESULTS,
  EXPORT_LAYER,
  BASEMAPS_MANAGEMENT,
}

export interface ITabViewConfig {
  idx: TabViews;
  title: string;
  iconClassName: string;
  dependentValue?: unknown;
}
