import React, { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useIntl } from 'react-intl';
import { Box } from '@map-colonies/react-components';
import { IconButton, Tooltip, useTheme } from '@map-colonies/react-core';

import { useStore } from '../../models/RootStore';
import { TabViews } from '../tab-views';

import './tabs-views-switcher.component.css';
import { isEmpty } from 'lodash';

interface TabViewsSwitcherComponentProps {
  handleTabViewChange: (tabView: TabViews) => void;
  activeTabView: TabViews;
  disabled?: boolean;
}

export interface ITabView {
  idx: TabViews;
  title: string;
  iconClassName: string;
  dependentValue?: unknown;
}

export const TabViewsSwitcher: React.FC<TabViewsSwitcherComponentProps> =
  observer((props) => {
    const store = useStore();
    const intl = useIntl();
    const theme = useTheme();
    const { handleTabViewChange, activeTabView } = props;

    const layerToExport = store.exportStore.layerToExport;

    const tabViews: ITabView[] = useMemo(
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
          iconClassName:
            intl.locale === 'en' ? 'mc-icon-Export' : 'mc-icon-Export-Left',
          dependentValue: store.exportStore.layerToExport,
        },
      ],
      [layerToExport]
    );

    const [availableTabs, setAvailableTabs] = useState<ITabView[]>(tabViews);

    useEffect(() => {
      const dependentTabs = tabViews.filter((tab) => {
        if ('dependentValue' in tab) {
          return !isEmpty(tab.dependentValue);
        }

        return tab;
      });

      setAvailableTabs(dependentTabs);
    }, [tabViews]);

    useEffect(() => {
      if (layerToExport !== undefined) {
        handleTabViewChange(TabViews.EXPORT_LAYER);
      } else {
        handleTabViewChange(TabViews.CATALOG);
      }
    }, [layerToExport]);

    return (
      <>
        <Box
          style={
            (props.disabled as boolean)
              ? { pointerEvents: 'none', opacity: 0.3 }
              : {}
          }
          className="headerViewsSwitcherContainer"
        >
          {availableTabs.map((tab) => {
            return (
              <Tooltip
                key={`tabView_${tab.idx}`}
                content={intl.formatMessage({
                  id: `action.${tab.title}.tooltip`,
                })}
              >
                <Box>
                  <IconButton
                    key={tab.idx}
                    className={`${tab.iconClassName} tabViewIcon`}
                    onClick={(
                      evt: React.MouseEvent<HTMLButtonElement, MouseEvent>
                    ): void => handleTabViewChange(tab.idx)}
                    style={{
                      backgroundColor: (activeTabView === tab.idx
                        ? theme.custom?.GC_SELECTION_BACKGROUND
                        : theme.custom?.GC_ALTERNATIVE_SURFACE) as string,
                      color:
                        activeTabView === tab.idx
                          ? 'var(--mdc-theme-text-icon-on-dark)'
                          : 'var(--mdc-theme-on-primary)',
                    }}
                    theme={[
                      activeTabView === tab.idx ? 'onPrimary' : 'onSurface',
                    ]}
                  />
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </>
    );
  });
