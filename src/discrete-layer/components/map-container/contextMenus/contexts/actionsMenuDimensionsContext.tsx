import { createContext } from 'react';
import { MenuDimensions } from '../../../../../common/hooks/mapMenus/useGetMenuDimensions';

interface IActionsMenuDimensionsContext {
  actionsMenuDimensions?: MenuDimensions;
  setActionsMenuDimensions: (menuDimensions: MenuDimensions) => void;
}

export default createContext<IActionsMenuDimensionsContext>({
  setActionsMenuDimensions: () => {
    return;
  },
});
