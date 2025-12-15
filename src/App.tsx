import React, { useState, useLayoutEffect,useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import Moment from 'moment';
import 'moment/locale/he'; // TODO: improve dynamic moment locales loading

// Import from react core components
import {
  ThemeProvider as RMWCThemeProvider,
  RMWCProvider,
  Themes,
  SnackbarQueue,
  IOptions,
} from '@map-colonies/react-core';
import { CssBaseline } from '@map-colonies/react-components';
import { useMediaQuery } from '@map-colonies/react-components';
import '@map-colonies/react-components/dist/date-range-picker-with-presets/styles';
import '@map-colonies/react-core/dist/theme/styles';
import '@map-colonies/react-core/dist/button/styles';
import '@map-colonies/react-core/dist/tooltip/styles';
import '@map-colonies/react-core/dist/menu/styles';
import '@map-colonies/react-core/dist/context-menu/styles';
import '@map-colonies/react-core/dist/select/styles';
import '@map-colonies/react-core/dist/circular-progress/styles';
import '@map-colonies/react-core/dist/typography/styles';
import '@map-colonies/react-core/dist/dialog/styles';
import '@map-colonies/react-core/dist/textfield/styles';
import '@map-colonies/react-core/dist/snackbar/styles';
import '@map-colonies/react-core/dist/icon/styles';
import '@map-colonies/react-core/dist/linear-progress/styles';
import '@map-colonies/react-core/dist/drawer/styles';
import '@map-colonies/react-core/dist/checkbox/styles';
import '@map-colonies/react-core/dist/fab/styles';
import '@map-colonies/react-core/dist/avatar/styles';
import '@map-colonies/react-core/dist/tabs/styles';
import '@map-colonies/react-core/dist/switch/styles';
import 'react-sortable-tree/style.css';
import './App.css';
import './App.dark-theme.css';
import './App.light-theme.css';


import { queue } from './discrete-layer/components/snackbar/notification-queue';
import { SnackContainer } from './discrete-layer/components/snackbar/snack-container';
import DiscreteLayerView from './discrete-layer/views/discrete-layer-view';
import { StaticDataFetcher } from './discrete-layer/views/components/data-fetchers/static-data-fetcher.component';
import MESSAGES from './common/i18n';
import CONFIG from './common/config';
import { camelize } from './common/helpers/string';
import { CustomTheme } from './theming/custom.theme';
import EnumsMapContext, { IEnumsMapType } from './common/contexts/enumsMap.context';
import LookupTablesContext, { ILookupTableData } from './common/contexts/lookupTables.context';
import WebSocketNotifications from './discrete-layer/views/components/notifications/web-socket-notifications';
import { PasswordAutofillDisabler } from './discrete-layer/views/components/password-autofill-disabler.component';

const App: React.FC = () => {
  /*const prefersDarkMode = */useMediaQuery('(prefers-color-scheme: dark)');
  // eslint-disable-next-line
  const [lang, setLang] = useState(CONFIG.I18N.DEFAULT_LANGUAGE);
  const [enumsMap, setEnumsMap] = useState<IEnumsMapType | null>(null);

  // const theme = Themes.lightTheme; //TODO: when dark theme will be tuned use this --> prefersDarkMode ? Themes.darkTheme : Themes.lightTheme;
  const customThemeProps: Record<string,string> = {};
  for (const prop in CustomTheme.darkTheme) {
    customThemeProps[camelize(prop)] = (CustomTheme.darkTheme as Record<string, string>)[prop];
  }
  const theme = {
    ...Themes.darkTheme,
    background: '#151A22',
    surface: '#151A22',
    alternativeSurface: '#2D3748',
    ...customThemeProps,
    custom: {
      ...CustomTheme.darkTheme
    }
  };

  const [lookupTablesData, setLookupTablesData] = useState<ILookupTableData>({});

  useLayoutEffect(() => {
    setLang(document.documentElement.lang);
  }, []);

  useEffect(() => {
    Moment.locale(lang);
  }, [lang]);

  return (
    <>
      <WebSocketNotifications />
      <IntlProvider onError={() => null} locale={lang} messages={MESSAGES[lang] as Record<string, string>}>
        <RMWCProvider
          typography={{
            body1: 'span',
            body2: ({ children, ...rest }): JSX.Element => (
              <span>
                <b>{children}</b>
              </span>
            ),
          }}
        >
          <RMWCThemeProvider className={`app-container ${theme.type}-theme`} options={theme as IOptions}>
            <PasswordAutofillDisabler />
            <CssBaseline />
            <LookupTablesContext.Provider value={{ lookupTablesData, setLookupTablesData }}>
              <EnumsMapContext.Provider value={{ enumsMap, setEnumsMap }}>
                <StaticDataFetcher />
                <DiscreteLayerView />
              </EnumsMapContext.Provider>
            </LookupTablesContext.Provider>
            <SnackContainer />
            <SnackbarQueue messages={queue.messages} leading timeout={-1} />
          </RMWCThemeProvider>
        </RMWCProvider>
      </IntlProvider>
    </>
  );
};

export default App;
