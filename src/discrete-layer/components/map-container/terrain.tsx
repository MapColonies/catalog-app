import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import {
  CesiumCesiumTerrainProvider,
  CesiumColor,
  CesiumEllipsoidTerrainProvider,
  useCesiumMap,
} from '@map-colonies/react-components';
import CONFIG from '../../../common/config';
import { Error } from '../../../common/components/tree/statuses/error';
import { getTokenResource } from '../helpers/layersUtils';
import { queue } from '../snackbar/notification-queue';

const NONE = 0;

interface TerrainProps {}

export const Terrain: React.FC<TerrainProps> = () => {
  const mapViewer = useCesiumMap();
  const intl = useIntl();

  mapViewer.scene.globe.depthTestAgainstTerrain = true;
  mapViewer.scene.globe.baseColor = CesiumColor.WHITESMOKE;

  useEffect(() => {
    function isTerrainTileError(e: Record<string, unknown>): boolean {
      return (e.level as number) > NONE;
    }

    function handleTerrainError(e: unknown): void {
      if (!isTerrainTileError(e as Record<string, unknown>)) {
        console.error(
          'Terrain provider error: Falling back to default terrain. ',
          e
        );

        queue.notify({
          body: (
            <Error
              className="errorNotification"
              message={intl.formatMessage({
                id: 'terrain-provider.access.error',
              })}
              details={CONFIG.DEFAULT_TERRAIN_PROVIDER_URL as string}
            />
          ),
        });

        // Remove the error listener after failing once
        mapViewer.terrainProvider.errorEvent.removeEventListener(
          handleTerrainError
        );

        mapViewer.terrainProvider = new CesiumEllipsoidTerrainProvider({});
      } else {
        console.error('Terrain provider error: Tile problem. ', e);
      }
    }

    if (CONFIG.DEFAULT_TERRAIN_PROVIDER_URL as string) {
      mapViewer.terrainProvider = new CesiumCesiumTerrainProvider({
        url: getTokenResource(CONFIG.DEFAULT_TERRAIN_PROVIDER_URL),
      });

      mapViewer.terrainProvider.errorEvent.addEventListener(handleTerrainError);
    } else {
      mapViewer.terrainProvider = new CesiumEllipsoidTerrainProvider({});
    }
  }, []);

  return <></>;
};
