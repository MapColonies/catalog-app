import React from 'react';
import { Button, useTheme } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import {
  DefaultTheme,
  NavigationIndependentTree,
  NavigationContainer,
  createStackNavigator,
} from '../../common/navigation/react-navigation.proxy';

interface BasemapsPanelProps {
  navigation: {
    navigate: (routeName: BasemapsRouteName) => void;
  };
}

type PanelParams<T = {}> = BasemapsPanelProps & T;

type BasemapsStackPanel = {
  BaseMapsList: PanelParams;
  EditBaseMap: PanelParams;
  AddLayer: PanelParams;
};

type BasemapsRouteName = keyof BasemapsStackPanel;

//#region TODO: Should be deleted when real implementation is exist
interface PlaceholderPanelProps extends BasemapsPanelProps {
  currentScreen: BasemapsRouteName;
  label: string;
}
const PlaceholderPanel: React.FC<PlaceholderPanelProps> = ({
  currentScreen,
  label,
  navigation,
}) => {
  const STACK_SCREENS: Array<{ name: BasemapsRouteName; label: string }> = [
    { name: 'BaseMapsList', label: 'Base maps list' },
    { name: 'EditBaseMap', label: 'Edit base map' },
    { name: 'AddLayer', label: 'Add layer' },
  ];

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        gap: '1rem',
        padding: '1rem',
      }}
    >
      <Box>{label}</Box>
      <Box style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {STACK_SCREENS.filter(({ name }) => name !== currentScreen).map(
          ({ name, label: targetLabel }) => (
            <Button key={name} type="button" onClick={(): void => navigation.navigate(name)}>
              {targetLabel}
            </Button>
          )
        )}
      </Box>
    </Box>
  );
};
//#endregion

const BaseMapsListScreen: React.FC<BasemapsPanelProps> = ({ navigation }) => (
  <PlaceholderPanel
    currentScreen="BaseMapsList"
    label="PLACEHOLDER_BASEMAPS"
    navigation={navigation}
  />
);

const EditBaseMapScreen: React.FC<BasemapsPanelProps> = ({ navigation }) => (
  <PlaceholderPanel
    currentScreen="EditBaseMap"
    label="PLACEHOLDER_EDIT_BASEMAP"
    navigation={navigation}
  />
);

const AddLayerScreen: React.FC<BasemapsPanelProps> = ({ navigation }) => (
  <PlaceholderPanel
    currentScreen="AddLayer"
    label="PLACEHOLDER_ADD_LAYER"
    navigation={navigation}
  />
);

const Stack = createStackNavigator<BasemapsStackPanel>();

export const BasemapsRouter: React.FC = () => {
  const theme = useTheme();
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.custom?.GC_TAB_ACTIVE_BACKGROUND,
    },
  };

  return (
    <NavigationIndependentTree>
      <Box style={{ display: 'flex', flex: 1, width: '100%', height: '100%', minHeight: 0 }}>
        <NavigationContainer documentTitle={{ enabled: false }} theme={navigationTheme}>
          <Stack.Navigator initialRouteName="BaseMapsList" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="BaseMapsList" component={BaseMapsListScreen} />
            <Stack.Screen name="EditBaseMap" component={EditBaseMapScreen} />
            <Stack.Screen name="AddLayer" component={AddLayerScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </Box>
    </NavigationIndependentTree>
  );
};
