import React, { CSSProperties } from 'react';
import { useTheme } from '@map-colonies/react-core';
import SortableTree, {
  ThemeProps,
  ReactSortableTreeProps,
  TreeItem as RSTTreeItem,
} from 'react-sortable-tree';
import CONFIG from '../../config';
import { TreeThemes } from './themes/themes';
import FileExplorerTheme from './renderers';

export interface TreeItem extends RSTTreeItem {}

export const TreeComponent: React.FC<ReactSortableTreeProps> = (props) => {
  const theme = useTheme();
  const treeTheme = TreeThemes.getTheme(theme) as CSSProperties;
  const rowDirection =
    CONFIG.I18N.DEFAULT_LANGUAGE.toUpperCase() === 'HE' ? 'rtl' : 'ltr';

  return (
    <div
      style={{
        height: '100%',
        ...treeTheme,
      }}
    >
      <SortableTree
        theme={FileExplorerTheme as ThemeProps}
        rowDirection={rowDirection}
        {...props}
      />
    </div>
  );
};
