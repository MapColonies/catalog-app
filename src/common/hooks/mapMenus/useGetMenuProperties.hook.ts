import { useEffect } from 'react';
import { IContextMenuData } from '@map-colonies/react-components';
import { useStore } from '../../../discrete-layer/models';
import {
  MapMenusIds,
  IMapMenuProperties,
} from '../../../discrete-layer/models/mapMenusManagerStore';
import { useHandleMapMenuTemplates } from './useHandleMapMenuTemplates.hook';

const useGetMenuProperties = (
  menuId: MapMenusIds,
  contextProps?: IContextMenuData
): IMapMenuProperties | undefined => {
  const store = useStore();
  const mapMenus = store.mapMenusManagerStore.mapMenus;
  const generatedByContextMenuProperties = useHandleMapMenuTemplates(
    mapMenus?.[menuId],
    contextProps
  );

  useEffect(() => {
    if (contextProps?.coordinates) {
      store.mapMenusManagerStore.setLastMenuCoordinate(
        contextProps?.coordinates
      );
    }
  }, [contextProps?.coordinates]);

  return generatedByContextMenuProperties;
};

export default useGetMenuProperties;
