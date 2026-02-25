import { useEffect, useRef, useState } from 'react';
import { isEmpty } from 'lodash';
import {
  CesiumCartographic,
  cesiumSampleTerrainMostDetailed,
  useCesiumMap,
} from '@map-colonies/react-components';
import { is2dArray, isArrayEqual } from '../helpers/array';

export interface IPosition {
  latitude: number;
  longitude: number;
}

interface UseHeightFromTerrainProps {
  position: IPosition[] | IPosition[][];
}

interface IHeightFromTerrain {
  newPositions?: CesiumCartographic[] | CesiumCartographic[][];
  setCoordinates: (pos: IPosition[] | IPosition[][]) => void;
  isLoadingData: boolean;
}

export const useHeightFromTerrain = (
  options?: UseHeightFromTerrainProps
): IHeightFromTerrain => {
  const mapViewer = useCesiumMap();
  const [newPositions, setNewPositions] = useState<
    CesiumCartographic[] | CesiumCartographic[][]
  >();
  const [coordinates, setCoordinates] = useState<IPosition[] | IPosition[][]>();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const prevPositions = useRef<IPosition[] | IPosition[][]>();

  useEffect(() => {
    if (
      options &&
      (!prevPositions.current ||
        !isArrayEqual(prevPositions.current, options.position))
    ) {
      prevPositions.current = options.position;
      setCoordinates(options.position);
    }
  }, [options?.position]);

  useEffect(() => {
    if (coordinates) {
      // @ts-ignore
      const is2dArr = is2dArray(coordinates);
      const cartographicArr:
        | CesiumCartographic[]
        | CesiumCartographic[][]
        | undefined = is2dArr
        ? coordinates.map((ring: any) =>
            ring.map((coord: any) =>
              CesiumCartographic.fromDegrees(coord.longitude, coord.latitude)
            )
          )
        : coordinates.map((coord: any) =>
            CesiumCartographic.fromDegrees(coord.longitude, coord.latitude)
          );

      setIsLoadingData(true);

      // const promises: Promise<CesiumCartographic[]>[] = [];

      if (is2dArr) {
        const promises: Promise<CesiumCartographic[]>[] = [];

        cartographicArr.forEach((ring: any): void => {
          // @ts-ignore
          promises.push(
            cesiumSampleTerrainMostDetailed(
              mapViewer.terrainProvider,
              ring as CesiumCartographic[]
            )
          );
        });

        Promise.all(promises)
          .then((updatedPositionsArr) => {
            if (!isEmpty(updatedPositionsArr)) {
              setNewPositions(updatedPositionsArr.map((arr) => arr.slice()));
            }
          })
          .catch(() => {
            setNewPositions(cartographicArr);
          })
          .finally(() => {
            setIsLoadingData(false);
          });
      } else {
        void cesiumSampleTerrainMostDetailed(
          mapViewer.terrainProvider,
          cartographicArr as CesiumCartographic[]
        )
          .then(
            (updatedPositions) => {
              if (!isEmpty(updatedPositions)) {
                setNewPositions([...updatedPositions] as CesiumCartographic[]);
              }
            },
            () => {
              setNewPositions(cartographicArr);
            }
          )
          .finally(() => {
            setIsLoadingData(false);
          });
      }
    }
  }, [coordinates]);

  return { newPositions, setCoordinates, isLoadingData };
};
