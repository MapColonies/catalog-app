import { useMemo } from 'react';
import { useStore } from '../models/RootStore';
import { isRtl } from '../../common/i18n/helpers';

export enum TabViews {
  CATALOG,
  SEARCH_RESULTS,
  EXPORT_LAYER,
  BASEMAPS,
}

export interface ITabViewConfig {
  idx: TabViews;
  title: string;
  iconClassName: string;
  dependentValue?: unknown;
}

export const useTabViewsConfig = (locale: string): ITabViewConfig[] => {
  const store = useStore();
  const layerToExport = store.exportStore.layerToExport;
  const isAdmin = store.userStore.isUserAdmin();
  const user = store.userStore.user;

  return useMemo(
    () => [
      {
        idx: TabViews.CATALOG,
        title: 'tab-views.catalog',
        iconClassName: 'mc-icon-Catalog',
      },
      {
        idx: TabViews.SEARCH_RESULTS,
        title: 'tab-views.search-results',
        iconClassName: 'mc-icon-Search-History',
      },
      {
        idx: TabViews.EXPORT_LAYER,
        title: 'tab-views.export-layer',
        iconClassName: isRtl(locale) ? 'mc-icon-Export-Left' : 'mc-icon-Export',
        dependentValue: layerToExport,
      },
      {
        idx: TabViews.BASEMAPS,
        title: 'tab-views.basemaps',
        iconClassName: 'mc-icon-Bests',
        dependentValue: isAdmin ? user : undefined,
      },
    ],
    [locale, layerToExport, isAdmin, user]
  );
};
