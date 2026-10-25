import { IBaseMap, useCesiumMap } from '@map-colonies/react-components';
import { useEffect } from 'react';
import { TabViews } from '../../views/tab-views';

interface BasemapSwitcherProps {
  activeTabView: TabViews;
}

export const BasemapSwitcher: React.FC<BasemapSwitcherProps> = (props) => {
  const mapViewer = useCesiumMap();

  useEffect(() => {
    if (props.activeTabView === TabViews.BASEMAPS_MANAGEMENT) {
      const NO_BASEMAP_ID = '__cesium-map-no-basemap__';

      mapViewer.layersManager?.removeBaseMapLayers();
      const noBasemapOption: IBaseMap = {
        id: NO_BASEMAP_ID,
        title: '***NO_TITLE***',
        // isCurrent: !realMaps.some((map) => map.isCurrent),
        isCurrent: false,
        baseRasterLayers: [],
      };
      mapViewer.layersManager?.setBaseMapLayers(noBasemapOption);
    }
  }, [props.activeTabView]);
  return <></>;
};
