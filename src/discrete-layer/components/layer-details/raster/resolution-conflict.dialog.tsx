import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { AutoSizer, List, ListRowProps } from 'react-virtualized';
import { Feature } from 'geojson';
import { Box } from '@map-colonies/react-components';
import {
  Button,
  Checkbox,
  CollapsibleList,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  SimpleListItem,
  Typography,
} from '@map-colonies/react-core';
import { AutoDirectionBox } from '../../../../common/components/auto-direction-box/auto-direction-box.component';
import { Mode } from '../../../../common/models/mode.enum';
import { EntityDescriptorModelType } from '../../../models';
import useZoomLevelsTable from '../../export-layer/hooks/useZoomLevelsTable';
import { Curtain } from './curtain/curtain.component';
import { Fill, Stroke, Text } from 'ol/style';
import { PolygonPartsExtentQueryVectorLayer } from './polygon-parts-extent-query-vector-layer';
import { GeoFeaturesPresentorComponent } from './pp-map';
import { FeatureType } from './pp-map.utils';
import { RasterWorkflowContext } from './state-machine/context';
import { UpdateLayerHeader } from './update-layer-header';
import { useWorkerAPI } from './worker/useWorkerAPI';

import './resolution-conflict.dialog.css';

interface ResolutionConflictDialogProps {
  isOpen: boolean;
  onSetIsOpen: (open: boolean) => void;
  onApprove?: () => void;
  viewOnly?: boolean;
}

interface ParsedFeatureCollection {
  name: string;
  features: Feature[];
}

const ResolutionConflictDialogComponent: React.FC<ResolutionConflictDialogProps> = ({
  isOpen,
  onSetIsOpen,
  onApprove,
  viewOnly = false,
}) => {
  const intl = useIntl();
  const api = useWorkerAPI();
  const hasLoadedRef = useRef(false);
  const ZOOM_LEVELS_TABLE = useZoomLevelsTable();
  const state = RasterWorkflowContext.useSelector((s) => s);
  const [showLowResolutionPolygonParts, setShowLowResolutionPolygonParts] = useState(false);
  const [selectedLowResolutionFeatureKey, setSelectedLowResolutionFeatureKey] = useState<string>();
  const [selectedLowResolutionFeatureRequestId, setSelectedLowResolutionFeatureRequestId] = useState(0);
  const [autoScrollListToSelection, setAutoScrollListToSelection] = useState(false);
  const [isLoadingLowResolutionParts, setIsLoadingLowResolutionParts] = useState(false);
  const [lowResolutionPartsError, setLowResolutionPartsError] = useState<string | undefined>();
  const [lowResolutionCollections, setLowResolutionCollections] = useState<ParsedFeatureCollection[]>([]);
  const [outerPerimeter, setOuterPerimeter] = useState<Feature | undefined>();
  const reportUrl = state.context.job?.validationReport?.report?.url;
  const ingestionResolution = state.context.job?.details?.parameters?.ingestionResolution as string | undefined;
  const entityDescriptors = state.context.store.discreteLayersStore?.entityDescriptors as EntityDescriptorModelType[];

  const lowResolutionFeatures = useMemo(
    () => lowResolutionCollections.flatMap((c) => c.features),
    [lowResolutionCollections]
  );
  const pendingSelectionFeatureRef = useRef<Feature | null>(null);
  const displayedLowResolutionFeaturesRef = useRef<Feature[]>([]);

  useEffect(() => {
    if (!showLowResolutionPolygonParts) {
      displayedLowResolutionFeaturesRef.current = [];
    }
  }, [showLowResolutionPolygonParts]);

  const isFootprintOnlyDisplay = useCallback((features?: Feature[]): boolean => {
    if (!features || features.length !== 1) {
      return false;
    }

    const properties = features[0]?.properties;
    return Boolean(
      properties &&
      typeof properties === 'object' &&
      (properties as Record<string, unknown>)._showAsFootprint
    );
  }, []);

  const selectedLowResolutionPosition = useMemo(() => {
    if (!selectedLowResolutionFeatureKey) {
      return undefined;
    }

    for (let collectionIndex = 0; collectionIndex < lowResolutionCollections.length; collectionIndex += 1) {
      const featureIndex = lowResolutionCollections[collectionIndex].features.findIndex(
        (feature) => feature.properties?._key === selectedLowResolutionFeatureKey
      );

      if (featureIndex !== -1) {
        return {
          collectionIndex,
          featureIndex,
        };
      }
    }

    return undefined;
  }, [lowResolutionCollections, selectedLowResolutionFeatureKey]);

  useEffect(() => {
    if (!autoScrollListToSelection || !selectedLowResolutionPosition) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setAutoScrollListToSelection(false);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [autoScrollListToSelection, selectedLowResolutionPosition]);

  const resolutionDegreeToZoomLevel = useMemo(() => {
    const table = Object.values(ZOOM_LEVELS_TABLE);
    return Object.fromEntries(table.map((v, i) => [v, i]));
  }, []);

  const zoomLevelForIngestion = useMemo(() => {
    if (!ingestionResolution) {
      return undefined;
    }
    return resolutionDegreeToZoomLevel[ingestionResolution];
  }, [ingestionResolution]);

  const collectionName = useMemo(() => {
    return intl.formatMessage(
      { id: 'resolutionConflict.collectionName' },
      { value: zoomLevelForIngestion }
    );
  }, [zoomLevelForIngestion]);

  useEffect(() => {
    if (!api || hasLoadedRef.current) { return; }

    hasLoadedRef.current = true;

    if (!reportUrl) {
      setLowResolutionCollections([]);
      setSelectedLowResolutionFeatureKey(undefined);
      setLowResolutionPartsError(intl.formatMessage({ id: 'resolutionConflict.error.missingUrl' }));
      return;
    }

    const loadLowResolutionParts = async (): Promise<void> => {
      setIsLoadingLowResolutionParts(true);
      setLowResolutionPartsError(undefined);

      try {
        await api.init.method();

        await api.loadFromShapeFile.method(reportUrl, {
          customProperties: {
            _key: '{index}-0',
            _featureLabel: intl.formatMessage({ id: 'resolutionConflict.partName' }),
            _zoomLevel: String(zoomLevelForIngestion),
            _featureType: FeatureType.LOW_RESOLUTION_PP,
          },
        });

        await api.updateAreas.method();

        const outerGeometry = await api.computeOuterGeometry.method();
        setOuterPerimeter({
          type: 'Feature',
          properties: {
            _featureType: FeatureType.LOW_RESOLUTION_PP
          },
          geometry: outerGeometry,
        });

        const featureCollection = await api.getFeatureCollection.method();

        setLowResolutionCollections([
          {
            name: collectionName,
            features: featureCollection.features,
          },
        ]);
        setSelectedLowResolutionFeatureKey(undefined);
      } catch (error) {
        const errorMessage = (error as Error)?.message;
        setLowResolutionCollections([]);
        setSelectedLowResolutionFeatureKey(undefined);
        setLowResolutionPartsError(`${intl.formatMessage({ id: 'resolutionConflict.error.fetchFailed' })}${errorMessage ? `: ${errorMessage}` : ''}`);
      } finally {
        setIsLoadingLowResolutionParts(false);
      }
    };

    void loadLowResolutionParts();

  }, [api]);

  const closeDialog = useCallback((): void => {
    onSetIsOpen(false);
  }, []);

  const approveDialog = useCallback((): void => {
    onApprove?.();
    closeDialog();
  }, []);

  return (
    <Box id="resolutionConflictDialog">
      <Dialog open={isOpen} preventOutsideDismiss={true}>
        <DialogTitle>
          <FormattedMessage id="validationReport.resolution" />
          <IconButton className="closeIcon mc-icon-Close" label="CLOSE" onClick={closeDialog} />
        </DialogTitle>
        <DialogContent className="dialogBody">
          <Box className="content">
            <Box className="rightPane">
              <Box className="lowResolutionPartsList curtainContainer">
                <Checkbox
                  className="lowResolutionPartsCheckbox"
                  label={intl.formatMessage({ id: 'polygon-parts.show-low-resolution-parts-on-map.label' })}
                  checked={showLowResolutionPolygonParts}
                  disabled={lowResolutionCollections.length === 0}
                  onClick={(evt: React.MouseEvent<HTMLInputElement>): void => {
                    const isChecked = evt.currentTarget.checked;
                    setShowLowResolutionPolygonParts(isChecked);

                    if (!isChecked) {
                      setAutoScrollListToSelection(false);
                      setSelectedLowResolutionFeatureKey(undefined);
                    }
                  }}
                />
                {isLoadingLowResolutionParts ? (
                  <Curtain showProgress={true} />
                ) : lowResolutionPartsError ? (
                  <></>
                ) : lowResolutionCollections.length === 0 ? (
                  <Typography tag="p" className="emptyList">
                    <FormattedMessage id="general.empty.text" />
                  </Typography>
                ) : (
                  lowResolutionCollections.map((collection, collectionIndex) => {
                    return (
                      <CollapsibleList
                        key={`${collection.name}-${collectionIndex}`}
                        open={
                          collectionIndex === 0 ||
                          collectionIndex === selectedLowResolutionPosition?.collectionIndex
                        }
                        handle={
                          <SimpleListItem
                            text={`${collection.name} (${collection.features.length})`}
                            metaIcon="chevron_right"
                          />
                        }
                      >
                        <Box className="collectionFeaturesVirtualized">
                          <AutoSizer>
                            {({ width, height }): JSX.Element => {
                              return (
                                <List
                                  width={width}
                                  height={height}
                                  rowCount={collection.features.length}
                                  rowHeight={32}
                                  overscanRowCount={8}
                                  scrollToIndex={
                                    autoScrollListToSelection &&
                                    collectionIndex === selectedLowResolutionPosition?.collectionIndex
                                      ? selectedLowResolutionPosition.featureIndex
                                      : undefined
                                  }
                                  scrollToAlignment="center"
                                  rowRenderer={({ index, key, style }: ListRowProps): JSX.Element => {
                                    const feature = collection.features[index];
                                    const featureLabel = feature.properties?._featureLabel;
                                    const type = feature.geometry.type;
                                    const calculatedArea = (feature.properties?._area as number | undefined) ?? 0;
                                    const featureId = (feature.properties?.id as string | undefined) ?? '';
                                    const featureKey = feature.properties?._key;
                                    const isSelected = featureKey === selectedLowResolutionFeatureKey;
                                    return (
                                      <Box
                                        className={`virtualizedFeatureRow${isSelected ? ' selected' : ''}`}
                                        key={key}
                                        style={style}
                                        onClick={(): void => {
                                          setShowLowResolutionPolygonParts(true);
                                          setAutoScrollListToSelection(false);
                                          setSelectedLowResolutionFeatureRequestId((current) => current + 1);
                                          if (featureKey) {
                                            pendingSelectionFeatureRef.current =
                                              lowResolutionFeatures.find((f) => f.properties?._key === featureKey) ?? null;
                                            setSelectedLowResolutionFeatureKey(featureKey);
                                          }
                                        }}
                                      >
                                        <Box className="featureContent">
                                          <Box className="featureTitleRow">
                                            <Typography className="featureLabel" tag="span">
                                              <AutoDirectionBox>
                                                <Typography tag="span">{featureLabel}</Typography>
                                                <Typography tag="span" className="featureLabelType"> ({type})</Typography>
                                              </AutoDirectionBox>
                                            </Typography>
                                            <Typography className="featureArea" tag="span">
                                              <AutoDirectionBox>
                                                <Typography tag="span">{calculatedArea.toFixed(2)}</Typography>
                                                <Typography tag="span" className="featureAreaUnits"><FormattedMessage id="resolutionConflict.units.km2"/></Typography>
                                              </AutoDirectionBox>
                                            </Typography>
                                          </Box>
                                          {featureId && (
                                            <Typography className="featureId" tag="span">
                                              <AutoDirectionBox>{featureId}</AutoDirectionBox>
                                            </Typography>
                                          )}
                                        </Box>
                                      </Box>
                                    );
                                  }}
                                />
                              );
                            }}
                          </AutoSizer>
                        </Box>
                      </CollapsibleList>
                    );
                  })
                )}
              </Box>
              <Box className="actionsRow">
                {!viewOnly && (
                  <Button
                    raised
                    type="button"
                    onClick={approveDialog}
                    disabled={isLoadingLowResolutionParts || lowResolutionCollections.length === 0}
                  >
                    <FormattedMessage id="general.ok-btn.text" />
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={closeDialog}
                >
                  <FormattedMessage id="general.close-btn.text" />
                </Button>
                {lowResolutionPartsError && (
                  <Typography className="error" tag="span">
                    {lowResolutionPartsError}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box className="leftPane">
              <UpdateLayerHeader
                entityDescriptors={entityDescriptors}
                layerRecord={state.context.updatedLayer}
              />
              <Box className="polygonPartsMap">
                <GeoFeaturesPresentorComponent
                  mode={Mode.UPDATE}
                  layerRecord={state.context.updatedLayer}
                  enableFeaturePropertiesPopup={true}
                  selectedFeatureKey={selectedLowResolutionFeatureKey}
                  selectedFeatureRequestId={selectedLowResolutionFeatureRequestId}
                  style={{ height: '100%', minHeight: '300px' }}
                  externalFeaturesRef={displayedLowResolutionFeaturesRef}
                  pendingSelectionFeatureRef={pendingSelectionFeatureRef}
                  onMapFeatureClick={(featureKey) => {
                    pendingSelectionFeatureRef.current = null;
                    if (featureKey === undefined) {
                      // An existing (green) feature was clicked — clear list selection
                      setAutoScrollListToSelection(false);
                      setSelectedLowResolutionFeatureKey(undefined);
                      return;
                    }
                    setShowLowResolutionPolygonParts(true);
                    setAutoScrollListToSelection(true);
                    setSelectedLowResolutionFeatureRequestId((current) => current + 1);
                    setSelectedLowResolutionFeatureKey(featureKey);
                  }}
                  onFeaturePropertiesPopupClose={(): void => {
                    setAutoScrollListToSelection(false);
                    setSelectedLowResolutionFeatureKey(undefined);
                  }}
                >
                  {
                    showLowResolutionPolygonParts && lowResolutionFeatures !== undefined
                      ? <PolygonPartsExtentQueryVectorLayer
                          featureType={FeatureType.LOW_RESOLUTION_PP}
                          queryExecutor={async (bbox, _startIndex): Promise<unknown> => {
                            if (!api) {
                              return { type: 'FeatureCollection', features: [] };
                            }
                            return await api.query.method({
                              minX: bbox[0],
                              minY: bbox[1],
                              maxX: bbox[2],
                              maxY: bbox[3],
                            });
                          }}
                          outerPerimeter={outerPerimeter?.geometry}
                          selectedFeatureKey={selectedLowResolutionFeatureKey}
                          onFeaturesChange={(updatedFeatures): void => {
                            displayedLowResolutionFeaturesRef.current = updatedFeatures;
                            if (isFootprintOnlyDisplay(updatedFeatures)) {
                              setAutoScrollListToSelection(false);
                              setSelectedLowResolutionFeatureKey(undefined);
                            }
                          }}
                          textStyleFactory={(feat) => {
                            const isFootprint = Boolean(feat.properties?._showAsFootprint);
                            if (isFootprint) {
                              return undefined;
                            }

                            const featureLabel = feat.properties?._featureLabel as string | undefined;
                            const zoomLevel = feat.properties?._zoomLevel;
                            const labelParts: string[] = [];

                            if (featureLabel) {
                              labelParts.push(featureLabel);
                            }
                            if (zoomLevel !== undefined && zoomLevel !== null) {
                              labelParts.push(`(${String(zoomLevel)})`);
                            }

                            if (labelParts.length === 0) {
                              return undefined;
                            }

                            return new Text({
                              text: labelParts.join('\n'),
                              textAlign: 'center',
                              textBaseline: 'middle',
                              font: 'bold 10px/1 Roboto',
                              fill: new Fill({ color: '#ff7f00' }),
                              stroke: new Stroke({ color: '#000', width: 3 }),
                              placement: 'point',
                              overflow: true,
                            });
                          }}
                          layerZIndex={2}
                          enablePagination={false}
                          dispatchQueryError={false}
                        />
                      : null
                  }
                </GeoFeaturesPresentorComponent>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

ResolutionConflictDialogComponent.displayName = 'ResolutionConflictDialog';

export const ResolutionConflictDialog = React.memo(ResolutionConflictDialogComponent);
