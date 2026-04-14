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
import { LowResolutionVectorLayer } from './low-resolution-vector-layer';
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
  const [isLoadingLowResolutionParts, setIsLoadingLowResolutionParts] = useState(false);
  const [lowResolutionPartsError, setLowResolutionPartsError] = useState<string | undefined>();
  const [lowResolutionCollections, setLowResolutionCollections] = useState<ParsedFeatureCollection[]>([]);
  const [perimeter, setPerimeter] = useState<Feature | undefined>();
  const reportUrl = state.context.job?.validationReport?.report?.url;
  const ingestionResolution = state.context.job?.details?.parameters?.ingestionResolution as string | undefined;
  const entityDescriptors = state.context.store.discreteLayersStore?.entityDescriptors as EntityDescriptorModelType[];

  const lowResolutionFeatures = useMemo(
    () => lowResolutionCollections.flatMap((c) => c.features),
    [lowResolutionCollections]
  );
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

        const lowResolutionPerimeter = await api.computeOuterGeometry.method();
        setPerimeter({
          type: 'Feature',
          properties: {
            featureType: FeatureType.LOW_RESOLUTION_PP
          },
          geometry: lowResolutionPerimeter,
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

  const formatArea = useCallback((area: number): string => {
    return intl.formatMessage({ id: 'resolutionConflict.units.km2' }, { value: area.toFixed(2) });
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
                                    collectionIndex === selectedLowResolutionPosition?.collectionIndex
                                      ? selectedLowResolutionPosition.featureIndex
                                      : undefined
                                  }
                                  scrollToAlignment="center"
                                  rowRenderer={({ index, key, style }: ListRowProps): JSX.Element => {
                                    const feature = collection.features[index];
                                    const featureLabel = feature.properties?._featureLabel;
                                    const calculatedArea = (feature.properties?._area as number | undefined) ?? 0;
                                    const featureId = (feature.properties?.id as string | undefined) ?? '';
                                    const featureKey = feature.properties?._key as string | undefined;
                                    const isSelected = featureKey === selectedLowResolutionFeatureKey;
                                    return (
                                      <Box
                                        className={`virtualizedFeatureRow${isSelected ? ' selected' : ''}`}
                                        key={key}
                                        style={style}
                                        onClick={(): void => {
                                          setShowLowResolutionPolygonParts(true);
                                          setSelectedLowResolutionFeatureRequestId((current) => current + 1);
                                          if (featureKey) {
                                            setSelectedLowResolutionFeatureKey(featureKey);
                                          }
                                        }}
                                      >
                                        <Box className="featureContent">
                                          <Box className="featureTitleRow">
                                            <Typography className="featureLabel" tag="span">
                                              <AutoDirectionBox>{featureLabel}</AutoDirectionBox>
                                            </Typography>
                                            <Typography className="featureArea" tag="span">
                                              <AutoDirectionBox>{formatArea(calculatedArea)}</AutoDirectionBox>
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
                  onMapFeatureClick={(featureKey) => {
                    if (featureKey === undefined) {
                      // An existing (green) feature was clicked — clear list selection
                      setSelectedLowResolutionFeatureKey(undefined);
                      return;
                    }
                    setShowLowResolutionPolygonParts(true);
                    setSelectedLowResolutionFeatureRequestId((current) => current + 1);
                    setSelectedLowResolutionFeatureKey(featureKey);
                  }}
                  onFeaturePropertiesPopupClose={(): void => {
                    setSelectedLowResolutionFeatureKey(undefined);
                  }}
                >
                  {showLowResolutionPolygonParts && lowResolutionFeatures !== undefined ? (
                      <LowResolutionVectorLayer
                        features={lowResolutionFeatures}
                        perimeter={perimeter}
                        selectedFeatureKey={selectedLowResolutionFeatureKey}
                        onFeaturesChange={(updatedFeatures): void => {
                          displayedLowResolutionFeaturesRef.current = updatedFeatures;
                          if (isFootprintOnlyDisplay(updatedFeatures)) {
                            setSelectedLowResolutionFeatureKey(undefined);
                          }
                        }}
                      />
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
