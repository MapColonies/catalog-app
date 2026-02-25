import { get } from 'lodash';
import { IOptions } from '@map-colonies/react-core';

// eslint-disable-next-line
export class GridThemes {
  // lightTheme: {
  // },
  // darkTheme: {
  //   "--ag-header-background-color": 'green',
  // },
  public static getTheme(mainTheme: IOptions): IOptions {
    const alternativeSurfaceColor = get(
      mainTheme,
      'custom.GC_ALTERNATIVE_SURFACE',
      mainTheme.surface
    ) as string;
    // const selectionBackground = get(mainTheme, 'custom.GC_SELECTION_BACKGROUND', mainTheme.surface) as string;
    const foregroundColor = get(
      mainTheme,
      'textIconOnDark',
      mainTheme.textPrimaryOnDark
    ) as string;

    return {
      '--ag-header-background-color': alternativeSurfaceColor,
      '--ag-border-color': alternativeSurfaceColor,
      '--ag-background-color': alternativeSurfaceColor,
      '--ag-row-border-color': alternativeSurfaceColor,
      '--ag-secondary-border-color': alternativeSurfaceColor,
      '--ag-odd-row-background-color': alternativeSurfaceColor,
      '--ag-selected-row-background-color': 'transparent',
      '--ag-foreground-color': foregroundColor,
      '--ag-font-size': '13px',
      '--ag-selected-details-row-background':
        '#38455c' /*GC_SELECTION_BACKGROUND with opacity 0.5*/,
    };
  }
}
