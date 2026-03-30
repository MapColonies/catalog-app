import React, { useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { AutoSizer, List, ListRowProps } from 'react-virtualized';
import { observer } from 'mobx-react';
import { Feature } from 'geojson';
import area from '@turf/area';
import shp, { FeatureCollectionWithFilename } from 'shpjs';
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
import { EntityDescriptorModelType, useStore } from '../../../models';
import useZoomLevelsTable from '../../export-layer/hooks/useZoomLevelsTable';
import { Curtain } from './curtain/curtain.component';
import { GeoFeaturesPresentorComponent } from './pp-map';
import { FeatureType } from './pp-map.utils';
import { RasterWorkflowContext } from './state-machine/context';
import { UpdateLayerHeader } from './update-layer-header';

import './resolution-conflict.dialog.css';

interface ResolutionConflictDialogProps {
  isOpen: boolean;
  onSetIsOpen: (open: boolean) => void;
  onApprove?: () => void;
}

interface ParsedFeatureCollection {
  name: string;
  features: Feature[];
}

export const ResolutionConflictDialog: React.FC<ResolutionConflictDialogProps> = observer(({
  isOpen,
  onSetIsOpen,
  onApprove,
}) => {
  const intl = useIntl();
  const store = useStore();
  const entityDescriptors = store.discreteLayersStore.entityDescriptors as EntityDescriptorModelType[];
  const state = RasterWorkflowContext.useSelector((s) => s);
  const [showLowResolutionPolygonParts, setShowLowResolutionPolygonParts] = useState(false);
  const [isLoadingLowResolutionParts, setIsLoadingLowResolutionParts] = useState(false);
  const [lowResolutionPartsError, setLowResolutionPartsError] = useState<string | undefined>();
  const [lowResolutionCollections, setLowResolutionCollections] = useState<ParsedFeatureCollection[]>([]);
  const ZOOM_LEVELS_TABLE = useZoomLevelsTable();

  const lowResolutionFeatures = useMemo(
    () => lowResolutionCollections.flatMap((c) => c.features),
    [lowResolutionCollections]
  );

  useEffect(() => {
    const reportUrl = state.context.job?.validationReport?.report?.url;

    if (!reportUrl) {
      setLowResolutionCollections([]);
      setLowResolutionPartsError(intl.formatMessage({ id: 'resolutionConflict.error.missingUrl' }));
      return;
    }

    let isCancelled = false;

    const loadLowResolutionParts = async (): Promise<void> => {
      setIsLoadingLowResolutionParts(true);
      setLowResolutionPartsError(undefined);

      try {
        const response = await store.fetch(reportUrl, 'GET', {}, { responseType: 'arraybuffer' });

        const parsed = await shp(response as unknown as ArrayBuffer);
        const collections = (Array.isArray(parsed) ? parsed : [parsed]) as FeatureCollectionWithFilename[];

        const normalized: ParsedFeatureCollection[] = collections.map((collection, index) => {
          const features = ((collection.features as Feature[]) ?? []).map((feature, featureIndex) => {
            const calculatedArea = (() => {
              try {
                return area(feature);
              } catch {
                return 0;
              }
            })();

            const featureLabel = intl.formatMessage(
              { id: 'resolutionConflict.partName' },
              { index: featureIndex + 1 }
            );

            return {
              ...feature,
              properties: {
                ...(feature.properties ?? {}),
                calculatedArea,
                featureLabel,
                featureType: FeatureType.LOW_RESOLUTION_PP,
              },
            } as Feature;
          });

          return {
            name: intl.formatMessage(
              { id: 'resolutionConflict.collectionName' },
              { value: resolutionDegreeToZoomLevel[state.context.job?.details?.parameters?.ingestionResolution] }
            ),
            features,
          };
        });

        if (!isCancelled) {
          setLowResolutionCollections(normalized);
        }
      } catch (error) {
        if (!isCancelled) {
          const errorMessage = (error as Error)?.message;
          setLowResolutionCollections([]);
          setLowResolutionPartsError(`${intl.formatMessage({ id: 'resolutionConflict.error.fetchFailed' })}${errorMessage ? `: ${errorMessage}` : ''}`);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingLowResolutionParts(false);
        }
      }
    };

    void loadLowResolutionParts();

    return () => {
      isCancelled = true;
    };
  }, []);

  const resolutionDegreeToZoomLevel = useMemo(() => {
    const table = Object.values(ZOOM_LEVELS_TABLE);
    return Object.fromEntries(table.map((v, i) => [v, i]));
  }, []);

  const closeDialog = (): void => {
    onSetIsOpen(false);
  };

  const approveDialog = (): void => {
    onApprove?.();
    closeDialog();
  };

  const formatArea = (areaSquareMeters: number): string => {
    const areaSquareKilometers = areaSquareMeters / 1_000_000;
    return intl.formatMessage({ id: 'resolutionConflict.units.km2' }, { value: areaSquareKilometers.toFixed(2) });
  };

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
                    setShowLowResolutionPolygonParts(evt.currentTarget.checked);
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
                                  rowRenderer={({ index, key, style }: ListRowProps): JSX.Element => {
                                    const feature = collection.features[index];
                                    const featureLabel =
                                      (feature.properties?.featureLabel as string | undefined) ??
                                      intl.formatMessage(
                                        { id: 'resolutionConflict.partName' },
                                        { index: index + 1 }
                                      );
                                    const calculatedArea =(feature.properties?.calculatedArea as number | undefined) ?? 0;
                                    const featureId = (feature.properties?.id as string | undefined) ?? '';
                                    return (
                                      <Box className="virtualizedFeatureRow" key={key} style={style}>
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
                <Button
                  raised
                  type="button"
                  onClick={approveDialog}
                  disabled={isLoadingLowResolutionParts || lowResolutionCollections.length === 0}
                >
                  <FormattedMessage id="general.ok-btn.text" />
                </Button>
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
                  geoFeatures={showLowResolutionPolygonParts ? lowResolutionFeatures : []}
                  style={{ height: '100%', minHeight: '300px' }}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
});
