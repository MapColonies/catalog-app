import { useMemo } from 'react';
import { isRtl } from '../../common/i18n/helpers';
import { UserAction } from '../models/userStore';
import { useStore } from '../models/RootStore';
import { ITabViewConfig, TabViews } from './tab-views';

export const useTabViewsConfig = (locale: string): ITabViewConfig[] => {
  const store = useStore();
  const layerToExport = store.exportStore.layerToExport;
  const isBasemapsManagementAllowed = store.userStore.isActionAllowed(
    UserAction.SYSTEM_ACTION_BASEMAPS_MANAGEMENT
  );
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
        idx: TabViews.BASEMAPS_MANAGEMENT,
        title: 'tab-views.basemaps',
        iconClassName: 'mc-icon-Bests',
        dependentValue: isBasemapsManagementAllowed ? user : undefined,
      },
    ],
    [locale, layerToExport, isBasemapsManagementAllowed, user]
  );
};
