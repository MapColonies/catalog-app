import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Feature, FeatureCollection, Point, Polygon } from 'geojson';
import { find } from 'lodash';
import { lineString } from '@turf/helpers';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerSubtitle,
  DrawerTitle,
  useTheme,
} from '@map-colonies/react-core';
import {
  DrawType,
  BboxCorner,
  CesiumMap,
  CesiumDrawingsDataSource,
  CesiumColor,
  CesiumSceneMode,
  IDrawingEvent,
  IDrawing,
  Box,
  DateTimeRangePickerFormControl,
  SupportedLocales,
} from '@map-colonies/react-components';
import CONFIG from '../../../common/config';
import { DrawerOpener } from '../drawer-opener/drawer-opener';
import { PolygonSelectionUi } from './polygon-selection-ui';
import { SelectedLayersContainer } from './selected-layers-container';
import { LayersFootprints } from './layers-footprints';
import { HighlightedLayer } from './highlighted-layer';

import './map-container.css';

interface IDrawingObject {
  type: DrawType;
  handler: (drawing: IDrawingEvent) => void;
}

const getTimeStamp = (): string => new Date().getTime().toString();
const noDrawing: IDrawingObject = {
  type: DrawType.UNKNOWN,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  handler: (drawing: IDrawingEvent) => {},
};
const DRAWING_MATERIAL_OPACITY = 0.5;
const DRAWING_MATERIAL_COLOR = CesiumColor.YELLOW.withAlpha(
  DRAWING_MATERIAL_OPACITY
);
const mapActionsWidth = '400px';

export interface MapContainerProps {
  handlePolygonSelected: (polygon: Polygon) => void;
  handlePolygonReset: () => void;
  mapContent?: React.ReactNode;
}

export const MapContainer: React.FC<MapContainerProps> = (props) => {
  const [resultsOpen, setResultsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawPrimitive, setDrawPrimitive] = useState<IDrawingObject>(noDrawing);
  const [drawEntities, setDrawEntities] = useState<IDrawing[]>([
    {
      coordinates: [],
      name: '',
      id: '',
      type: DrawType.UNKNOWN,
    },
  ]);
  const theme = useTheme();
  const intl = useIntl();
  const [center] = useState<[number, number]>(
    CONFIG.MAP.CENTER as [number, number]
  );
  const createDrawPrimitive = (type: DrawType): IDrawingObject => {
    return {
      type: type,
      handler: (drawing: IDrawingEvent): void => {
        const timeStamp = getTimeStamp();

        setIsDrawing(false);

        props.handlePolygonSelected(
          (drawing.geojson as Feature).geometry as Polygon
        );

        setDrawEntities([
          {
            coordinates: drawing.primitive,
            name: `${type.toString()}_${timeStamp}`,
            id: timeStamp,
            type: drawing.type,
          },
        ]);

        if (!resultsOpen) {
          setResultsOpen(true);
        }
      },
    };
  };

  const setDrawType = (drawType: DrawType): void => {
    setIsDrawing(true);
    setDrawPrimitive(createDrawPrimitive(drawType));
  };

  const onPolygonSelection = (polygon: IDrawingEvent): void => {
    const timeStamp = getTimeStamp();
    const bottomLeftPoint = find(
      (polygon.geojson as FeatureCollection<Point>).features,
      (feat: Feature<Point>) => {
        return feat.properties?.type === BboxCorner.BOTTOM_LEFT;
      }
    ) as Feature<Point>;
    const rightTopPoint = find(
      (polygon.geojson as FeatureCollection<Point>).features,
      (feat: Feature<Point>) => {
        return feat.properties?.type === BboxCorner.TOP_RIGHT;
      }
    ) as Feature<Point>;
    const line = lineString([
      [
        bottomLeftPoint.geometry.coordinates[0],
        bottomLeftPoint.geometry.coordinates[1],
      ],
      [
        rightTopPoint.geometry.coordinates[0],
        rightTopPoint.geometry.coordinates[1],
      ],
    ]);
    const boxPolygon = bboxPolygon(bbox(line));

    setDrawEntities([
      {
        coordinates: polygon.primitive,
        name: `${DrawType.BOX.toString()}_${timeStamp}`,
        id: timeStamp,
        type: DrawType.BOX,
        geojson: polygon.geojson,
      },
    ]);

    props.handlePolygonSelected((boxPolygon as Feature).geometry as Polygon);
  };

  const onReset = (): void => {
    setDrawEntities([]);
    props.handlePolygonReset();
  };

  const onCancelDraw = (): void => {
    setIsDrawing(false);
    setDrawPrimitive(noDrawing);
  };

  return (
    <div className="map">
      <div
        className="filtersPosition"
        style={{
          backgroundColor: theme.primary as string,
          width: mapActionsWidth,
        }}
      >
        <div className="filtersContainer">
          <PolygonSelectionUi
            onCancelDraw={onCancelDraw}
            onReset={onReset}
            onStartDraw={setDrawType}
            isSelectionEnabled={isDrawing}
            onPolygonUpdate={onPolygonSelection}
            mapActionsWidth={mapActionsWidth}
            handleOtherDrawers={(): void => setFiltersOpen(false)}
          />
          <div className="filtersMargin">
            <Button
              outlined
              theme={['primaryBg', 'onPrimary']}
              onClick={(): void => setFiltersOpen(!filtersOpen)}
              icon="filter_alt"
            >
              <FormattedMessage id="filters.title" />
            </Button>
            {filtersOpen && (
              <Box
                className="drawerPosition"
                style={{ height: '300px', width: mapActionsWidth }}
              >
                <Drawer dismissible open={filtersOpen}>
                  <DrawerHeader>
                    <DrawerTitle>
                      <FormattedMessage id="filters.title" />
                    </DrawerTitle>
                    <DrawerSubtitle>
                      <FormattedMessage id="filters.sub-title" />
                    </DrawerSubtitle>
                  </DrawerHeader>
                  <DrawerContent style={{ padding: '0px 16px' }}>
                    <DateTimeRangePickerFormControl
                      width={'100%'}
                      renderAsButton={false}
                      onChange={(dateRange): void => {
                        console.log(
                          'DateTimeRangePickerFormControl--->',
                          dateRange.from,
                          dateRange.to
                        );
                      }}
                      local={{
                        setText: intl.formatMessage({
                          id: 'filters.date-picker.set-btn.text',
                        }),
                        startPlaceHolderText: intl.formatMessage({
                          id: 'filters.date-picker.start-time.label',
                        }),
                        endPlaceHolderText: intl.formatMessage({
                          id: 'filters.date-picker.end-time.label',
                        }),
                        calendarLocale:
                          SupportedLocales[
                            CONFIG.I18N.DEFAULT_LANGUAGE.toUpperCase() as keyof typeof SupportedLocales
                          ],
                      }}
                    />
                  </DrawerContent>
                </Drawer>
              </Box>
            )}

            {resultsOpen && (
              <Box
                className="drawerPosition"
                style={{ height: '600px', width: mapActionsWidth, zIndex: -1 }}
              >
                <Drawer dismissible open={resultsOpen}>
                  <DrawerHeader>
                    <DrawerTitle>RESULTS</DrawerTitle>
                    <DrawerSubtitle>Subtitle</DrawerSubtitle>
                  </DrawerHeader>
                  <DrawerContent></DrawerContent>
                </Drawer>
              </Box>
            )}

            <DrawerOpener isOpen={resultsOpen} onClick={setResultsOpen} />
          </div>
        </div>
      </div>
      <CesiumMap
        projection={CONFIG.MAP.PROJECTION}
        center={center}
        zoom={CONFIG.MAP.ZOOM}
        sceneMode={CesiumSceneMode.SCENE2D}
        imageryProvider={false}
      >
        {props.mapContent}
        <SelectedLayersContainer />
        <HighlightedLayer />
        <LayersFootprints />
        <CesiumDrawingsDataSource
          drawings={drawEntities}
          drawingMaterial={DRAWING_MATERIAL_COLOR}
          drawState={{
            drawing: isDrawing,
            type: drawPrimitive.type,
            handler: drawPrimitive.handler,
          }}
        />
      </CesiumMap>
    </div>
  );
};
