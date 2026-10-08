import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Button, useTheme } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import {
  DefaultTheme,
  NavigationIndependentTree,
  NavigationContainer,
  createStackNavigator,
  StackHeaderProps,
  StackScreenProps,
} from '../../common/navigation/react-navigation.proxy';
import {
  BasemapActionSelector,
  PickLayerPanel,
} from '../components/basemaps/add-layer/pick-layer.panel';

import './base-maps-router.css';

type BasemapsStackPanel = {
  BaseMapsList: undefined;
  EditBaseMap: undefined;
  AddLayer: { actionSelector: BasemapActionSelector };
};

type BasemapsRouteName = keyof BasemapsStackPanel;

const PANELS_IDS: Record<BasemapsRouteName, string> = {
  BaseMapsList: 'basemaps.panels.base-maps-list',
  EditBaseMap: 'basemaps.panels.edit-base-map',
  AddLayer: 'basemaps.panels.add-layer',
};

const XXXBasemapsHeaderMOCKXXX: React.FC<StackHeaderProps> = ({ route, navigation }) => {
  const intl = useIntl();
  const { routes } = navigation.getState();
  // Each screen renders its own header, so only show the trail up to this screen
  const trail = routes.slice(0, routes.findIndex(({ key }) => key === route.key) + 1);

  return (
    <Box className="basemapsHeader">
      <nav className="basemapsBreadcrumb">
        {trail.map(({ key, name }, index) => {
          const label = intl.formatMessage({ id: PANELS_IDS[name as BasemapsRouteName] });
          return (
            <React.Fragment key={key}>
              {index > 0 && <span className="basemapsBreadcrumbSeparator">/</span>}
              {index < trail.length - 1 ? (
                <button
                  type="button"
                  className="basemapsBreadcrumbLink"
                  onClick={(): void => navigation.popTo(name)}
                >
                  {label}
                </button>
              ) : (
                <span aria-current="page">{label}</span>
              )}
            </React.Fragment>
          );
        })}
      </nav>
      <Box style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {(Object.keys(PANELS_IDS) as BasemapsRouteName[])
          .filter((name) => name !== route.name)
          .map((name) => (
            <Button key={name} type="button" onClick={(): void => navigation.navigate(name)}>
              {intl.formatMessage({ id: PANELS_IDS[name] })}
            </Button>
          ))}
      </Box>
    </Box>
  );
};

type BasemapsScreenProps<T extends BasemapsRouteName> = StackScreenProps<BasemapsStackPanel, T>;

const BaseMapsListScreen: React.FC<BasemapsScreenProps<'BaseMapsList'>> = () => null;

const EditBaseMapScreen: React.FC<BasemapsScreenProps<'EditBaseMap'>> = () => null;

const AddLayerScreen: React.FC<BasemapsScreenProps<'AddLayer'>> = ({ navigation, route }) => (
  <PickLayerPanel
    actionSelector={route.params.actionSelector}
    onClose={(): void => navigation.goBack()}
  />
);

const Stack = createStackNavigator<BasemapsStackPanel>();

export const BasemapsRouter: React.FC = () => {
  const theme = useTheme();
  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: theme.custom?.GC_ALTERNATIVE_SURFACE as string,
      },
    }),
    [theme]
  );

  return (
    <NavigationIndependentTree>
      <Box style={{ display: 'flex', flex: 1, width: '100%', height: '100%', minHeight: 0 }}>
        <NavigationContainer documentTitle={{ enabled: false }} theme={navigationTheme}>
          <Stack.Navigator
            initialRouteName="BaseMapsList"
            screenOptions={{
              header: (props): React.ReactNode => <XXXBasemapsHeaderMOCKXXX {...props} />,
            }}
          >
            <Stack.Screen name="BaseMapsList" component={BaseMapsListScreen} />
            <Stack.Screen name="EditBaseMap" component={EditBaseMapScreen} />
            <Stack.Screen
              name="AddLayer"
              component={AddLayerScreen}
              // TODO: actionSelector should come from the caller once the other selectors land
              initialParams={{ actionSelector: BasemapActionSelector.CatalogResource }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </Box>
    </NavigationIndependentTree>
  );
};
