/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useCallback, useEffect } from 'react';
import { observer } from 'mobx-react';
import { IMapLegend } from '@map-colonies/react-components/dist/cesium-map/legend';
import { IBaseMaps } from '@map-colonies/react-components/dist/cesium-map/map';
import { LinkType } from '../../../../common/models/link-type.enum';
import { MOCK_DATA_IMAGERY_LAYERS_ISRAEL } from '../../../../__mocks-data__/search-results.mock';
import { useStore } from '../../../models/RootStore';
import { LinkModelType } from '../../../models';
import { ILayerImage } from '../../../models/layerImage';

export const BaseMapsLegendsFetcher: React.FC = observer(() => {
  const store = useStore();

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const GET_MOCK_LAYER_WITH_LINKS = async (
    layerId: string
  ): Promise<ILayerImage> => {
    const MOCK_LINKS_PER_ID = new Map<string, unknown[]>([
      [
        'GOOGLE_TERRAIN',
        [
          {
            protocol: LinkType.LEGEND_DOC,
            url: 'http://www.africau.edu/images/default/sample.pdf',
          },
          {
            protocol: LinkType.LEGEND_IMG,
            url: 'https://c8.alamy.com/comp/F5HF5D/map-icon-legend-symbol-sign-toolkit-element-F5HF5D.jpg',
          },
        ],
      ],
      [
        'INFRARED_RASTER',
        [
          {
            protocol: LinkType.LEGEND_DOC,
            url: 'http://www.africau.edu/images/default/sample.pdf',
          },
          {
            protocol: LinkType.LEGEND_IMG,
            url: 'https://i.pinimg.com/564x/55/cf/a1/55cfa147dfef99d231ec95ab8cd3652d--outdoor-code-cub-scouts-brownie-hiking-badge.jpg',
          },
        ],
      ],
      ['RADAR_RASTER', []],
      ['VECTOR_TILES_GPS', []],
      [
        'VECTOR_TILES',
        [
          {
            protocol: LinkType.LEGEND_DOC,
            url: 'http://www.africau.edu/images/default/sample.pdf',
          },
          {
            protocol: LinkType.LEGEND_IMG,
            url: 'https://i.pinimg.com/564x/55/cf/a1/55cfa147dfef99d231ec95ab8cd3652d--outdoor-code-cub-scouts-brownie-hiking-badge.jpg',
          },
        ],
      ],
      ['VECTOR_TILES_GPS', []],
      [
        'AZURE_RASTER_WMTS_FULL_IL',
        [
          {
            protocol: LinkType.LEGEND_DOC,
            url: 'http://www.africau.edu/images/default/sample.pdf',
          },
          {
            protocol: LinkType.LEGEND_IMG,
            url: 'https://c8.alamy.com/comp/F5HF5D/map-icon-legend-symbol-sign-toolkit-element-F5HF5D.jpg',
          },
        ],
      ],
      ['AZURE_RASTER_WMTS_BLUEMARBEL_IL', []],
    ]);

    const MOCK_LAYER = MOCK_DATA_IMAGERY_LAYERS_ISRAEL[0];

    return new Promise((resolve) => {
      setTimeout(() => {
        // @ts-ignore
        resolve({ ...MOCK_LAYER, links: MOCK_LINKS_PER_ID.get(layerId) });

        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      }, 2000);
    });
  };

  const getLegendsWithBasemaps = useCallback(
    async (baseMaps: IBaseMaps): Promise<IBaseMaps> => {
      const LEGEND_PDF_PROTOCOL = LinkType.LEGEND_DOC;
      const LEGEND_IMG_PROTOCOL = LinkType.LEGEND_IMG;

      const baseMapsWithLegends = await Promise.all(
        baseMaps.maps.map(async (baseMap) => {
          return {
            ...baseMap,
            baseRasterLayers: await Promise.all(
              baseMap.baseRasterLayers.map(async (rasterLayer) => {
                // Here we'll make the call to get the legends from the links in DB.
                const layerFromCatalog = await GET_MOCK_LAYER_WITH_LINKS(
                  rasterLayer.id
                );
                const legendsLinks = (
                  layerFromCatalog.links as unknown as LinkModelType[]
                ).filter((link) =>
                  [LEGEND_PDF_PROTOCOL, LEGEND_IMG_PROTOCOL].includes(
                    link.protocol as LinkType
                  )
                );

                return {
                  ...rasterLayer,
                  options: {
                    ...rasterLayer.options,
                    legends: [
                      {
                        layer: rasterLayer.id,
                        legendDoc: legendsLinks.find(
                          (link) => link.protocol === LEGEND_PDF_PROTOCOL
                        ),
                        legendImg: legendsLinks.find(
                          (link) => link.protocol === LEGEND_IMG_PROTOCOL
                        ),
                      },
                    ] as IMapLegend[],
                  },
                };
              })
            ),
          };
        })
      );

      return { maps: [...baseMapsWithLegends] };
    },
    []
  );

  useEffect(() => {
    void (async (): Promise<void> => {
      const currentBasemaps = store.discreteLayersStore.baseMaps;
      if (currentBasemaps) {
        const basemaps = await getLegendsWithBasemaps(currentBasemaps);
        store.discreteLayersStore.setBaseMaps(basemaps);
      }
    })();
  }, []);

  return <></>;
});
