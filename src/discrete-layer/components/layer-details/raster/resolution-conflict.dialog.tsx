import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { AutoSizer, List, ListRowProps } from 'react-virtualized';
import { BBox, Feature } from 'geojson';
import { get } from 'lodash';
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
  TextField,
  Typography,
} from '@map-colonies/react-core';
import { AutoDirectionBox } from '../../../../common/components/auto-direction-box/auto-direction-box.component';
import { Domain } from '../../../../common/models/domain';
import { Mode } from '../../../../common/models/mode.enum';
import { EntityDescriptorModelType } from '../../../models';
import useZoomLevelsTable from '../../export-layer/hooks/useZoomLevelsTable';
import { Process } from './worker/worker.types';
import { extractProgressArray } from './worker/utils';
import { useWorkerAPI } from './worker/useWorkerAPI';
import {
  IQueryExecutorResponse,
  PolygonPartsExtentQueryVectorLayer,
} from './polygon-parts-extent-query-vector-layer';
import { ProgressCurtain } from './progressCurtain/progressCurtain';
import { GeoFeaturesPresentorComponent } from './pp-map';
import { FeatureType } from './pp-map.utils';
import { RasterWorkflowContext } from './state-machine/context';
import { UpdateLayerHeader } from './update-layer-header';

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

type FilterMode = 'all' | 'exceeded';
const SHOW_PARTS_AFTER_INIT = true;

const ResolutionConflictDialogComponent: React.FC<ResolutionConflictDialogProps> = ({
  isOpen,
  onSetIsOpen,
  onApprove,
  viewOnly = false,
}) => {
  const intl = useIntl();
  const [api, stagesInfo] = useWorkerAPI({
    [Process.ComputeOuterGeometry]: 2,
  });
  const hasLoadedRef = useRef(false);
  const visibleRowRangesRef = useRef<Record<number, { startIndex: number; stopIndex: number }>>({});
  const ZOOM_LEVELS_TABLE = useZoomLevelsTable();
  const state = RasterWorkflowContext.useSelector((s) => s);
  const [showLowResolutionPolygonParts, setShowLowResolutionPolygonParts] = useState(false);
  const [autoScrollListToSelection, setAutoScrollListToSelection] = useState(false);
  const [isLoadingLowResolutionParts, setIsLoadingLowResolutionParts] = useState(false);
  const [lowResolutionPartsError, setLowResolutionPartsError] = useState<string | undefined>();
  const [lowResolutionCollections, setLowResolutionCollections] = useState<
    ParsedFeatureCollection[]
  >([]);
  const [outerPerimeter, setOuterPerimeter] = useState<Feature | undefined>();
  const [collectionMountKeys, setCollectionMountKeys] = useState<number[]>([]);
  const [approver, setApprover] = useState('');
  const [listFilterMode, setListFilterMode] = useState<FilterMode>('all');
  const [selectedItem, setSelectedItem] = useState<Feature>();
  const selectedLowResolutionFeatureKey = selectedItem?.properties?._key as string | undefined;
  const reportUrl = state.context.job?.validationReport?.report?.url;
  const ingestionResolution = state.context.job?.details?.parameters?.ingestionResolution as
    | string
    | undefined;
  const entityDescriptors = state.context.store.discreteLayersStore
    ?.entityDescriptors as EntityDescriptorModelType[];

  const lowResolutionFeatures = useMemo(
    () => lowResolutionCollections.flatMap((c) => c.features),
    [lowResolutionCollections]
  );

  const totalFeaturesCount = useMemo(() => lowResolutionFeatures.length, [lowResolutionFeatures]);

  const hasExceededFeatures = useMemo(
    () => lowResolutionFeatures.some((feature) => feature.properties?.exceeded === true),
    [lowResolutionFeatures]
  );

  const exceededFeaturesCount = useMemo(
    () => lowResolutionFeatures.filter((feature) => feature.properties?.exceeded === true).length,
    [lowResolutionFeatures]
  );

  const filteredLowResolutionCollections = useMemo(() => {
    if (listFilterMode === 'all') {
      return lowResolutionCollections;
    }

    return lowResolutionCollections.map((collection) => ({
      ...collection,
      features: collection.features.filter((feature) => feature.properties?.exceeded === true),
    }));
  }, [lowResolutionCollections, listFilterMode]);

  const hasFilteredFeatures = useMemo(
    () => filteredLowResolutionCollections.some((collection) => collection.features.length > 0),
    [filteredLowResolutionCollections]
  );

  useEffect(() => {
    if (listFilterMode === 'exceeded' && !hasExceededFeatures) {
      setListFilterMode('all');
    }
  }, [hasExceededFeatures, listFilterMode]);

  const selectedLowResolutionPosition = useMemo(() => {
    if (!selectedLowResolutionFeatureKey) {
      return undefined;
    }

    for (
      let collectionIndex = 0;
      collectionIndex < filteredLowResolutionCollections.length;
      collectionIndex += 1
    ) {
      const featureIndex = filteredLowResolutionCollections[collectionIndex].features.findIndex(
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
  }, [filteredLowResolutionCollections, selectedLowResolutionFeatureKey]);

  useEffect(() => {
    if (!autoScrollListToSelection || !selectedLowResolutionPosition) {
      return;
    }

    setCollectionMountKeys((prev) => {
      const next = prev.slice();
      next[selectedLowResolutionPosition.collectionIndex] =
        (next[selectedLowResolutionPosition.collectionIndex] ?? 0) + 1;
      return next;
    });
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
  }, []);

  const collectionName = useMemo(() => {
    return intl.formatMessage(
      { id: 'resolutionConflict.collectionName' },
      { value: zoomLevelForIngestion }
    );
  }, [zoomLevelForIngestion]);

  useEffect(() => {
    if (!api || hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;

    if (!reportUrl) {
      setLowResolutionCollections([]);
      setSelectedItem(undefined);
      setLowResolutionPartsError(intl.formatMessage({ id: 'resolutionConflict.error.missingUrl' }));
      return;
    }

    const loadLowResolutionParts = async (): Promise<void> => {
      setIsLoadingLowResolutionParts(true);
      setLowResolutionPartsError(undefined);

      await api.init.method();

      const downloadWorkerError = await api.loadFromShapeFile.method(reportUrl, {
        customProperties: {
          _key: '{index}-0',
          _featureLabel: intl.formatMessage({ id: 'resolutionConflict.partName' }),
          _zoomLevel: String(zoomLevelForIngestion),
          _featureTitle: `${intl.formatMessage({ id: 'resolutionConflict.partName' })} (${String(
            zoomLevelForIngestion
          )})`,
          _featureType: FeatureType.LOW_RESOLUTION_PP,
        },
      });

      if (downloadWorkerError) {
        return;
      }

      const updateAreasError = await api.updateAreas.method();

      if (updateAreasError) {
        return;
      }

      const outerGeometry = await api.computeOuterGeometry.method();
      setOuterPerimeter({
        type: 'Feature',
        properties: {
          _featureType: FeatureType.LOW_RESOLUTION_PP,
        },
        geometry: outerGeometry,
      });

      const outerExceededGeometry = await api.computeOuterGeometry.method(
        (properties) => properties.exceeded === true
      );

      const featureCollection = await api.getFeatureCollection.method();

      const newCollections = [
        {
          name: collectionName,
          features: featureCollection.features,
        },
      ];
      setLowResolutionCollections(newCollections);
      setCollectionMountKeys(newCollections.map(() => 0));
      setSelectedItem(undefined);
      setIsLoadingLowResolutionParts(false);
      setShowLowResolutionPolygonParts(SHOW_PARTS_AFTER_INIT);
    };

    void loadLowResolutionParts();
  }, [api]);

  const closeDialog = useCallback((): void => {
    onSetIsOpen(false);
  }, []);

  const approveDialog = useCallback((): void => {
    const resumeJob = async (): Promise<void> => {
      try {
        await state.context.store.mutateJobApproveAndResume({
          data: {
            approver: approver.trim(),
          },
          jobApproveAndResumeParams: {
            id: String(state.context.job?.jobId),
            domain: Domain.RASTER,
            type: String(state.context.job?.details?.type ?? ''),
          },
        });
        onApprove?.();
        closeDialog();
      } catch (error) {
        setLowResolutionPartsError(
          intl.formatMessage({ id: 'resolutionConflict.error.approveFailed' })
        );
      }
    };
    void resumeJob();
  }, [approver]);

  const progresses = useMemo(() => {
    return extractProgressArray(api);
  }, [api]);

  const clearLowResolutionSelection = useCallback((): void => {
    setSelectedItem(undefined);
    setAutoScrollListToSelection(false);
  }, []);

  const queryExecutor = async (bbox: BBox, _startIndex: number): Promise<IQueryExecutorResponse> => {
    if (!api) {
      return { features: [], pageSize: -1 };
    }
    const result = await api.query.method({
      minX: bbox[0],
      minY: bbox[1],
      maxX: bbox[2],
      maxY: bbox[3],
    });
    const fetchedFeatures = get(result, 'features', []);
    const features = Array.isArray(fetchedFeatures) ? fetchedFeatures : [];
    return { features, pageSize: -1 };
  };

  const onFeaturesChange = (updatedFeatures: Feature[]): void => {
    const currentSelectedKey = selectedItem?.properties?._key;
    if (currentSelectedKey !== undefined) {
      const selectedFromUpdatedFeatures = updatedFeatures.find(
        (feature) => feature.properties?._key === currentSelectedKey
      );
      if (selectedFromUpdatedFeatures) {
        if (selectedFromUpdatedFeatures !== selectedItem) {
          setSelectedItem(selectedFromUpdatedFeatures);
        }
      }
    }
  };

  const shouldScrollToFeature = useCallback(
    (feature?: Feature): boolean => {
      const featureKey = feature?.properties?._key;
      if (!featureKey) {
        return false;
      }
      for (
        let collectionIndex = 0;
        collectionIndex < filteredLowResolutionCollections.length;
        collectionIndex += 1
      ) {
        const featureIndex = filteredLowResolutionCollections[collectionIndex].features.findIndex(
          (collectionFeature) => collectionFeature.properties?._key === featureKey
        );
        if (featureIndex === -1) {
          continue;
        }
        const visibleRange = visibleRowRangesRef.current[collectionIndex];
        if (!visibleRange) {
          return true;
        }
        return featureIndex < visibleRange.startIndex || featureIndex > visibleRange.stopIndex;
      }
      return true;
    },
    [filteredLowResolutionCollections]
  );

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
              <Box
                className={`lowResolutionPartsList ${
                  isLoadingLowResolutionParts ? 'curtainContainer' : 'padding'
                }`}
              >
                <Box className="lowResolutionPartsCheckboxContainer">
                  {!isLoadingLowResolutionParts && (
                    <Checkbox
                      className="lowResolutionPartsCheckbox"
                      label={intl.formatMessage({
                        id: 'polygon-parts.show-low-resolution-parts-on-map.label',
                      })}
                      checked={showLowResolutionPolygonParts}
                      disabled={lowResolutionCollections.length === 0}
                      onClick={(evt: React.MouseEvent<HTMLInputElement>): void => {
                        const isChecked = evt.currentTarget.checked;
                        setShowLowResolutionPolygonParts(isChecked);
                        if (!isChecked) {
                          setAutoScrollListToSelection(false);
                          setSelectedItem(undefined);
                        }
                      }}
                    />
                  )}
                </Box>
                {!isLoadingLowResolutionParts && (
                  <Box className="filterContainer">
                    <Button
                      type="button"
                      outlined
                      className={`filterButton${listFilterMode === 'all' ? ' active' : ''}`}
                      disabled={lowResolutionCollections.length === 0}
                      onClick={(): void => {
                        clearLowResolutionSelection();
                        setListFilterMode('all');
                      }}
                    >
                      <FormattedMessage id="resolutionConflict.filter.all" /> ({totalFeaturesCount})
                    </Button>
                    <Button
                      type="button"
                      outlined
                      className={`filterButton${listFilterMode === 'exceeded' ? ' active' : ''}`}
                      disabled={lowResolutionCollections.length === 0 || !hasExceededFeatures}
                      onClick={(): void => {
                        clearLowResolutionSelection();
                        setListFilterMode('exceeded');
                      }}
                    >
                      <FormattedMessage id="resolutionConflict.filter.exceeded" /> (
                      {exceededFeaturesCount})
                    </Button>
                  </Box>
                )}
                {isLoadingLowResolutionParts ? (
                  <ProgressCurtain
                    stagesInfo={stagesInfo}
                    workerMessages={progresses}
                  ></ProgressCurtain>
                ) : lowResolutionCollections.length === 0 || !hasFilteredFeatures ? (
                  <Typography tag="p" className="emptyList">
                    <FormattedMessage id="general.empty.text" />
                  </Typography>
                ) : (
                  filteredLowResolutionCollections.map((collection, collectionIndex) => {
                    return (
                      <CollapsibleList
                        key={`${collection.name}-${collectionIndex}-${
                          collectionMountKeys[collectionIndex] ?? 0
                        }`}
                        defaultOpen={true}
                        handle={
                          <SimpleListItem
                            text={`${collection.name} (${collection.features.length})`}
                            metaIcon="chevron_right"
                          />
                        }
                      >
                        <Box className="virtualizedFeatureList">
                          <AutoSizer>
                            {({ width, height }): JSX.Element => {
                              return (
                                <List
                                  width={width}
                                  height={height}
                                  rowCount={collection.features.length}
                                  rowHeight={32}
                                  overscanRowCount={8}
                                  onRowsRendered={({ startIndex, stopIndex }): void => {
                                    visibleRowRangesRef.current[collectionIndex] = {
                                      startIndex,
                                      stopIndex,
                                    };
                                  }}
                                  scrollToIndex={
                                    autoScrollListToSelection &&
                                    collectionIndex ===
                                      selectedLowResolutionPosition?.collectionIndex
                                      ? selectedLowResolutionPosition.featureIndex
                                      : undefined
                                  }
                                  scrollToAlignment="center"
                                  rowRenderer={({
                                    index,
                                    key,
                                    style,
                                  }: ListRowProps): JSX.Element => {
                                    const feature = collection.features[index];
                                    const featureLabel = feature.properties?._featureLabel;
                                    const type = feature.geometry.type;
                                    const calculatedArea =
                                      (feature.properties?._area as number | undefined) ?? 0;
                                    const featureId =
                                      (feature.properties?.id as string | undefined) ?? '';
                                    const featureKey = feature.properties?._key;
                                    const isSelected =
                                      featureKey === selectedLowResolutionFeatureKey;
                                    const isExceeded = feature.properties?.exceeded === true;
                                    return (
                                      <Box
                                        className={`virtualizedFeatureItem${
                                          isSelected ? ' selected' : ''
                                        }${isExceeded ? ' exceeded' : ''}`}
                                        key={key}
                                        style={style}
                                        onClick={(): void => {
                                          setShowLowResolutionPolygonParts(true);
                                          setAutoScrollListToSelection(false);
                                          if (featureKey) {
                                            // Use feature directly from collection, ensure it has all properties
                                            const featureWithType = {
                                              ...feature,
                                              properties: {
                                                ...feature.properties,
                                                _featureType: FeatureType.LOW_RESOLUTION_PP,
                                                _flyTo: true,
                                              },
                                            };
                                            setSelectedItem(featureWithType);
                                          }
                                        }}
                                      >
                                        <Box className="featureContent">
                                          <Box className="featureTitleRow">
                                            <Typography className="featureLabel" tag="span">
                                              <AutoDirectionBox>
                                                <Typography tag="span">{featureLabel}</Typography>
                                                <Typography tag="span" className="featureLabelType">
                                                  {' '}
                                                  ({type})
                                                </Typography>
                                              </AutoDirectionBox>
                                            </Typography>
                                            <Typography className="featureArea" tag="span">
                                              <AutoDirectionBox>
                                                <Typography tag="span">
                                                  {calculatedArea.toFixed(2)}
                                                </Typography>
                                                <Typography tag="span" className="featureAreaUnits">
                                                  <FormattedMessage id="resolutionConflict.units.km2" />
                                                </Typography>
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
              <Box className="rightPaneFooter">
                <Box className="detailsFieldValue approverNameFieldContainer">
                  {!viewOnly && (
                    <TextField
                      className="approverNameField"
                      disabled={isLoadingLowResolutionParts || hasExceededFeatures}
                      value={approver}
                      onChange={(event): void => {
                        setApprover(event.currentTarget.value);
                      }}
                      label={intl.formatMessage({ id: 'resolutionConflict.approver.label' })}
                    />
                  )}
                </Box>
                <Box className="actionsRow">
                  {!viewOnly && (
                    <Button
                      raised
                      type="button"
                      onClick={approveDialog}
                      disabled={
                        isLoadingLowResolutionParts ||
                        lowResolutionCollections.length === 0 ||
                        approver.trim().length === 0
                      }
                    >
                      <FormattedMessage id="general.ok-btn.text" />
                    </Button>
                  )}
                  <Button type="button" onClick={closeDialog}>
                    <FormattedMessage id="general.close-btn.text" />
                  </Button>
                  {lowResolutionPartsError && (
                    <Typography className="error errorMessage" tag="span">
                      {lowResolutionPartsError}
                    </Typography>
                  )}
                </Box>
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
                  style={{ height: '100%', minHeight: '300px' }}
                  selectedItem={selectedItem}
                  onMapFeatureClick={(feature) => {
                    if (feature?.properties?._key === undefined) {
                      // An existing (green) feature was clicked — clear list selection
                      setSelectedItem(undefined);
                      setAutoScrollListToSelection(false);
                      return;
                    }

                    const clickedFeature = lowResolutionFeatures.find(
                      (feat) => feat.properties?._key === feature?.properties?._key
                    );
                    const shouldSwitchToAllFilter =
                      listFilterMode === 'exceeded' && clickedFeature?.properties?.exceeded !== true;

                    if (shouldSwitchToAllFilter) {
                      setListFilterMode('all');
                    }

                    setShowLowResolutionPolygonParts(true);
                    setAutoScrollListToSelection(
                      shouldSwitchToAllFilter ? true : shouldScrollToFeature(clickedFeature)
                    );
                    setSelectedItem(clickedFeature);
                  }}
                  showPolygonParts={SHOW_PARTS_AFTER_INIT}
                >
                  {showLowResolutionPolygonParts && lowResolutionFeatures !== undefined ? (
                    <>
                      <PolygonPartsExtentQueryVectorLayer
                        featureType={FeatureType.LOW_RESOLUTION_PP}
                        queryExecutor={queryExecutor}
                        outerPerimeter={outerPerimeter?.geometry}
                        onFeaturesChange={onFeaturesChange}
                        onQueryError={(errorMessage): void => {
                          setLowResolutionPartsError(errorMessage);
                        }}
                        options={{ properties: { id: FeatureType.LOW_RESOLUTION_PP }, zIndex: 2 }}
                      />
                    </>
                  ) : null}
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
