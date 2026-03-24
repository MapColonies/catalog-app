import React, { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { AutoSizer, List, ListRowProps } from 'react-virtualized';
import { observer } from 'mobx-react';
import { Feature } from 'geojson';
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
import { Mode } from '../../../../common/models/mode.enum';
import { EntityDescriptorModelType, useStore } from '../../../models';
import { LayersDetailsComponent } from '../layer-details';
import { GeoFeaturesPresentorComponent } from './pp-map';
import { RasterWorkflowContext } from './state-machine/context';

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
  const layerRecord = state.context.updatedLayer;
  const [showLowResolutionPolygonParts, setShowLowResolutionPolygonParts] = useState(false);
  const [isLoadingLowResolutionParts, setIsLoadingLowResolutionParts] = useState(false);
  const [lowResolutionPartsError, setLowResolutionPartsError] = useState<string | undefined>();
  const [lowResolutionCollections, setLowResolutionCollections] = useState<ParsedFeatureCollection[]>(
    []
  );

  const reportUrl = state.context.job?.validationReport?.report?.url;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!reportUrl) {
      setLowResolutionCollections([]);
      setLowResolutionPartsError('Missing validation report URL');
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
          return {
            name: collection.fileName ?? `Collection ${index + 1}`,
            features: (collection.features as Feature[]) ?? [],
          };
        });

        if (!isCancelled) {
          setLowResolutionCollections(normalized);
        }
      } catch (error) {
        if (!isCancelled) {
          setLowResolutionCollections([]);
          setLowResolutionPartsError((error as Error)?.message ?? 'Failed to parse low resolution parts');
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

  const closeDialog = (): void => {
    onSetIsOpen(false);
  };

  const approveDialog = (): void => {
    onApprove?.();
    closeDialog();
  };

  return (
    <Box id="resolutionConflictDialog">
      <Dialog open={isOpen} preventOutsideDismiss={true}>
        <DialogTitle>
          <FormattedMessage id="validationReport.resolution" />
          <IconButton className="closeIcon mc-icon-Close" label="CLOSE" onClick={closeDialog} />
        </DialogTitle>
        <DialogContent className="dialogBody">
          <Box id="updateLayerHeader">
            <Box id="updateLayerHeaderContent">
              <LayersDetailsComponent
                className="detailsPanelProductView"
                entityDescriptors={entityDescriptors}
                layerRecord={layerRecord}
                isBrief={true}
                mode={Mode.VIEW}
              />
            </Box>
          </Box>
          <Box className="content">
            <Box className="rightPane">
              <Checkbox
                className="lowResolutionPartsCheckbox"
                label={intl.formatMessage({ id: 'polygon-parts.show-low-resolution-parts-on-map.label' })}
                checked={showLowResolutionPolygonParts}
                onClick={(evt: React.MouseEvent<HTMLInputElement>): void => {
                  setShowLowResolutionPolygonParts(evt.currentTarget.checked);
                }}
              />
              <Box className="lowResolutionPartsList">
                {isLoadingLowResolutionParts ? (
                  <Typography tag="p">Loading shapefile...</Typography>
                ) : lowResolutionPartsError ? (
                  <Typography className="error" tag="p">
                    {lowResolutionPartsError}
                  </Typography>
                ) : lowResolutionCollections.length === 0 ? (
                  <Typography tag="p">No low resolution parts found</Typography>
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
                                      (feature.properties?.partId as string | undefined) ??
                                      (feature.id as string | undefined) ??
                                      `Feature ${index + 1}`;

                                    return (
                                      <Box className="virtualizedFeatureRow" key={key} style={style}>
                                        {featureLabel}
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
                <Button raised type="button" onClick={approveDialog}>
                  <FormattedMessage id="general.ok-btn.text" />
                </Button>
                <Button type="button" onClick={closeDialog}>
                  <FormattedMessage id="general.close-btn.text" />
                </Button>
              </Box>
            </Box>
            <Box className="leftPane">
              <GeoFeaturesPresentorComponent
                mode={Mode.UPDATE}
                style={{ height: '100%', minHeight: '300px' }}
              />
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
});
