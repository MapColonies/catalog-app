import React, { PropsWithChildren, useState } from 'react';
import { IBaseMaps, Legend, LegendItem, Map, MapProps } from '@map-colonies/react-components';
import { OlBaseMap } from './ol.base-map';
import { MapLoadingIndicator } from './map-loading-indicator';
import { ToggleBaseMap } from './toggle-base-map';
import { ZoomLevelIndicator } from './zoom-level-indicator';

export interface IOLMapBaseMaps {
  baseMaps: IBaseMaps | undefined;
  defaultShowBaseMap?: boolean;
  toggleBaseMap?: boolean;
}

export interface IOLMapLocale {
  ZOOM_LABEL: string;
  LEGEND_TITLE: string;
  BASE_MAP_ENABLE_LABEL: string;
  BASE_MAP_DISABLE_LABEL: string;
}

export interface IOLMapProps extends MapProps {
  legends?: LegendItem[];
  baseMapsConfig?: IOLMapBaseMaps;
  zoomLevelWidget?: {
    indicateTillZoomLevel?: number | undefined;
  } | null;
  mapLoadingIndicator?: boolean;
  locale?: IOLMapLocale;
}

const DEFAULT_ZOOM_WIDGET: NonNullable<IOLMapProps['zoomLevelWidget']> = {};

export const OLMap: React.FC<PropsWithChildren<IOLMapProps>> = ({
  legends,
  baseMapsConfig,
  zoomLevelWidget = DEFAULT_ZOOM_WIDGET,
  mapLoadingIndicator = true,
  locale,
  children,
  ...mapProps
}) => {
  const [showBaseMap, setShowBaseMap] = useState<boolean>(
    baseMapsConfig?.defaultShowBaseMap ?? true
  );

  return (
    <Map {...mapProps}>
      {mapLoadingIndicator && <MapLoadingIndicator />}
      {baseMapsConfig && showBaseMap && <OlBaseMap baseMaps={baseMapsConfig.baseMaps} />}
      {zoomLevelWidget && (
        <ZoomLevelIndicator
          indicateTillZoomLevel={zoomLevelWidget.indicateTillZoomLevel}
          label={locale?.ZOOM_LABEL}
        />
      )}
      {legends && legends.length > 0 && (
        <Legend legendItems={legends} title={locale?.LEGEND_TITLE} />
      )}
      {baseMapsConfig?.toggleBaseMap && (
        <ToggleBaseMap
          isBaseMapVisible={showBaseMap}
          onToggle={(): void => setShowBaseMap((prev) => !prev)}
          enableLabel={locale?.BASE_MAP_ENABLE_LABEL ?? ''}
          disableLabel={locale?.BASE_MAP_DISABLE_LABEL ?? ''}
        />
      )}
      {children}
    </Map>
  );
};
