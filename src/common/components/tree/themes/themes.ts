import { get } from 'lodash';
import { IOptions } from '@map-colonies/react-core';

// eslint-disable-next-line
export class TreeThemes {
  public static getTheme(mainTheme: IOptions): IOptions {
    const selectionBackground = get(
      mainTheme,
      'custom.GC_SELECTION_BACKGROUND',
      mainTheme.surface
    ) as string;
    const hoverBackground = get(
      mainTheme,
      'custom.GC_HOVER_BACKGROUND',
      'rgba(33, 150, 243, 0.1)'
    ) as string;

    const rstTheme = {
      '--rst-selected-background-color': selectionBackground,
      '--rst-hover-background-color': hoverBackground,
      '--rst-highlight-line-size': '6px',
      '--rst-node-label-width': '280px',
      '--rst-expander-size': '30px',
    };
    // return Object.entries(rstTheme).map(
    //   ([key, value]) => `${key}:${value}`
    // ).join(';');
    return rstTheme;
  }
}
