import React from 'react';
import {
  NavigationIndependentTree,
  NavigationContainer,
  createStackNavigator,
} from '../../common/navigation/react-navigation.proxy';
import { BasemapsProvider } from '../contexts/layers.context';

// TODO: replace `undefined` params once BaseMapsListScreen / EditBaseMapScreen / AddLayerScreen land.
type BaseMapsStackParamList = {
  BaseMapsList: undefined;
  EditBaseMap: undefined;
  AddLayer: undefined;
};

const Stack = createStackNavigator<BaseMapsStackParamList>();

export const BaseMapsRouter: React.FC = () => {
  return (
    <NavigationIndependentTree>
      <NavigationContainer documentTitle={{ enabled: false }}>
        <BasemapsProvider>
          <Stack.Navigator initialRouteName="BaseMapsList">
            {null}
            {/* <Stack.Screen
              name="BaseMapsList"
              component={BaseMapsListScreen}
            /> */}
            {/* <Stack.Screen
              name="EditBaseMap"
              component={EditBaseMapScreen}
            /> */}
            {/* <Stack.Screen
              name="AddLayer"
              component={AddLayerScreen}
            /> */}
          </Stack.Navigator>
        </BasemapsProvider>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
};
