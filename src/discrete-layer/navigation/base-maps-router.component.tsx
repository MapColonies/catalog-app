import React from 'react';
import { Box } from '@map-colonies/react-components';
import {
  NavigationIndependentTree,
  NavigationContainer,
  createStackNavigator,
} from '../../common/navigation/react-navigation.proxy';

// TODO: replace `undefined` params once BaseMapsListScreen / EditBaseMapScreen / AddLayerScreen land.
type BaseMapsStackParamList = {
  BaseMapsList: undefined;
  EditBaseMap: undefined;
  AddLayer: undefined;
};

const Stack = createStackNavigator<BaseMapsStackParamList>();

export const BasemapsRouter: React.FC = () => {
  return (
    <NavigationIndependentTree>
      <NavigationContainer documentTitle={{ enabled: false }}>
        <Stack.Navigator initialRouteName="BaseMapsList" screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="BaseMapsList"
            // component={BaseMapsListScreen}
            component={() => <Box>PLACEHOLDER_BASEMAPS</Box>}
          />
          <Stack.Screen
            name="EditBaseMap"
            // component={EditBaseMapScreen}
            component={() => <Box>PLACEHOLDER_EDIT_BASEMAP</Box>}
          />
          <Stack.Screen
            name="AddLayer"
            // component={AddLayerScreen}
            component={() => <Box>PLACEHOLDER_ADD_LAYER</Box>}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
};
