import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useTheme } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import {
  DefaultTheme,
  NavigationIndependentTree,
  NavigationContainer,
  createStackNavigator,
  StackHeaderProps,
  StackScreenProps,
} from '../../../common/navigation/react-navigation.proxy';
import { Breadcrumb } from '../../../common/components/breadcrumb/breadcrumb';
import { BasemapsListPanel } from './basemaps-list.panel';
import { PickLayerPanel } from './pick-layer.panel';
import { BasemapComposer } from './basemap-composer.panel';

import './basemaps-router.css';
import { SourceTypeInput } from './XXXbasemapMockXXX';

type BasemapsStackPanel = {
  BasemapsList: undefined;
  BasemapComposer: { id?: string };
  AddLayer: { actionSelector: SourceTypeInput };
};

type BasemapsRouteName = keyof BasemapsStackPanel;

const PANELS_IDS: Record<BasemapsRouteName, string> = {
  BasemapsList: 'basemaps.panels.base-maps-list',
  BasemapComposer: 'basemaps.panels.compose-base-map',
  AddLayer: 'basemaps.panels.add-layer',
};

const BasemapsBreadcrumb: React.FC<StackHeaderProps> = ({ route, navigation }) => {
  const intl = useIntl();
  const { routes } = navigation.getState();
  const trail = routes.slice(0, routes.findIndex(({ key }) => key === route.key) + 1);
  const getLabel = (name: BasemapsRouteName): string =>
    intl.formatMessage({ id: PANELS_IDS[name] });

  return (
    <Box className="basemapsHeader">
      <Breadcrumb
        items={trail.map(({ key, name }) => ({
          key,
          label: getLabel(name as BasemapsRouteName),
        }))}
        onCrumbClick={(key): void => {
          const target = trail.find((item) => item.key === key);
          if (target) {
            navigation.popTo(target.name);
          }
        }}
      />
    </Box>
  );
};

export type BasemapsPanelProps<T extends BasemapsRouteName> = StackScreenProps<
  BasemapsStackPanel,
  T
>;

const AddLayerPanel: React.FC<BasemapsPanelProps<'AddLayer'>> = ({ navigation, route }) => (
  <PickLayerPanel
    actionSelector={route.params.actionSelector}
    existingLayers={undefined}
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
      <Box className="basemapsRouterContainer">
        <NavigationContainer documentTitle={{ enabled: false }} theme={navigationTheme}>
          <Stack.Navigator
            initialRouteName="BasemapsList"
            screenOptions={{
              header: (props): React.ReactNode => <BasemapsBreadcrumb {...props} />,
            }}
          >
            <Stack.Screen name="BasemapsList" component={BasemapsListPanel} />
            <Stack.Screen name="BasemapComposer" component={BasemapComposer} />
            <Stack.Screen name="AddLayer" component={AddLayerPanel} />
          </Stack.Navigator>
        </NavigationContainer>
      </Box>
    </NavigationIndependentTree>
  );
};
