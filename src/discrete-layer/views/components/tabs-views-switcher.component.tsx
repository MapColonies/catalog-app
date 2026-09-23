import React, { useEffect, useState } from 'react';
import { isEmpty } from 'lodash';
import { observer } from 'mobx-react-lite';
import { useIntl } from 'react-intl';
import { Box } from '@map-colonies/react-components';
import { IconButton, Tooltip, useTheme } from '@map-colonies/react-core';
import { useStore } from '../../models/RootStore';
import { ITabViewConfig, TabViews } from '../tab-views';
import { useTabViewsConfig } from '../useTabViewsConfig.hook';

import './tabs-views-switcher.component.css';

interface TabViewsSwitcherComponentProps {
  handleTabViewChange: (tabView: TabViews) => void;
  activeTabView: TabViews;
}

export const TabViewsSwitcher: React.FC<TabViewsSwitcherComponentProps> = observer((props) => {
  const store = useStore();
  const intl = useIntl();
  const theme = useTheme();
  const { handleTabViewChange, activeTabView } = props;

  const layerToExport = store.exportStore.layerToExport;

  const tabViews: ITabViewConfig[] = useTabViewsConfig(intl.locale);

  const [availableTabs, setAvailableTabs] = useState<ITabViewConfig[]>(tabViews);

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
    } else if (activeTabView === TabViews.EXPORT_LAYER) {
      handleTabViewChange(TabViews.CATALOG);
    }
  }, [layerToExport]);

  return (
    <>
      <Box className="headerViewsSwitcherContainer">
        {availableTabs.map((tab) => {
          return (
            <Tooltip
              key={`tabView_${tab.idx}`}
              content={intl.formatMessage({ id: `action.${tab.title}.tooltip` })}
            >
              <Box>
                <IconButton
                  key={tab.idx}
                  className={`${tab.iconClassName} tabViewIcon`}
                  onClick={(evt: React.MouseEvent<HTMLButtonElement, MouseEvent>): void =>
                    handleTabViewChange(tab.idx)
                  }
                  style={{
                    backgroundColor: (activeTabView === tab.idx
                      ? theme.custom?.GC_SELECTION_BACKGROUND
                      : theme.custom?.GC_ALTERNATIVE_SURFACE) as string,
                    color:
                      activeTabView === tab.idx
                        ? 'var(--mdc-theme-text-icon-on-dark)'
                        : 'var(--mdc-theme-on-primary)',
                  }}
                  theme={[activeTabView === tab.idx ? 'onPrimary' : 'onSurface']}
                />
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </>
  );
});
