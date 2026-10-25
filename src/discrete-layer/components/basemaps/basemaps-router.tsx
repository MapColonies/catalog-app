import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { MenuItem, Select, useTheme } from '@map-colonies/react-core';
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

import './basemaps-router.css';
import { BasemapActionSelector } from './XXXbasemapMockXXX';

type BasemapsStackPanel = {
  BasemapsList: undefined;
  EditBasemap: undefined;
  AddLayer: { actionSelector: BasemapActionSelector };
};

type BasemapsRouteName = keyof BasemapsStackPanel;

const PANELS_IDS: Record<BasemapsRouteName, string> = {
  BasemapsList: 'basemaps.panels.base-maps-list',
  EditBasemap: 'basemaps.panels.edit-base-map',
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
        stack={trail.map(({ name }) => getLabel(name as BasemapsRouteName))}
        onCrumbClick={(label): void => {
          const target = trail.find(({ name }) => getLabel(name as BasemapsRouteName) === label);
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

const BasemapComposer: React.FC<BasemapsPanelProps<'EditBasemap'>> = ({ navigation }) => {
  const intl = useIntl();

  return (
    <Select
      id="basemap-action-selector"
      value=""
      enhanced
      outlined
      onChange={(event: React.ChangeEvent<HTMLSelectElement>): void => {
        const selectedValue = event.currentTarget.value;
        if (selectedValue !== '') {
          navigation.navigate('AddLayer', {
            actionSelector: Number(selectedValue) as BasemapActionSelector,
          });
        }
      }}
    >
      <MenuItem value="" disabled>
        {intl.formatMessage({ id: PANELS_IDS.AddLayer })}
      </MenuItem>
      <MenuItem value={BasemapActionSelector.CatalogResource}>
        {intl.formatMessage({ id: 'basemaps.edit.action-selector.catalog-resource' })}
      </MenuItem>
      <MenuItem value={BasemapActionSelector.External}>
        {intl.formatMessage({ id: 'basemaps.edit.action-selector.external' })}
      </MenuItem>
    </Select>
  );
};

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
            <Stack.Screen name="EditBasemap" component={BasemapComposer} />
            <Stack.Screen name="AddLayer" component={AddLayerPanel} />
          </Stack.Navigator>
        </NavigationContainer>
      </Box>
    </NavigationIndependentTree>
  );
};
