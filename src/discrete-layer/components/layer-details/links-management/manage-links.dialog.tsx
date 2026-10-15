import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import { DialogContent } from '@material-ui/core';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from '@map-colonies/react-core';
import {
  Box,
  CesiumColor,
  CesiumMap,
  CesiumSceneMode,
  CesiumViewer,
  useCesiumMap,
} from '@map-colonies/react-components';
import { LinkType } from '../../../../common/models/link-type.enum';
import { ErrorPresentor } from '../../error/error-presentor';
import { formatError } from '../../helpers/errorUtils';
import { getLinkUrlWithToken } from '../../helpers/layersUtils';
import { downloadBlobToClient } from '../utils';
import {
  DEFAULT_LAYER_MANAGER_META_MAPPING,
  generateLayerComponent,
} from '../../helpers/generateLayerComponent';
import { RecordType, useQuery, useStore } from '../../../models';
import { IDispatchAction } from '../../../models/actionDispatcherStore';
import { ILayerImage } from '../../../models/layerImage';
import { UserAction } from '../../../models/userStore';
import {
  blobToDataUrl,
  CaptureSize,
  computeInitialFlyToTarget,
  flyPreviewCameraTo,
  THUMBNAIL_CAPTURE_DIMENSIONS,
  THUMBNAIL_SIZE_TO_PROTOCOL,
  withNoCurrentBasemap,
} from './links-management.utils';
import { FileLinkSlot } from './file-link-slot';
import { LinkSection } from './link-section';
import { ThumbnailsSection } from './thumbnails-section';
import { exportLayerResourcesZip } from './zip-export';
import { parseLayerResourcesZip, ZipImportError, ZipImportErrorCode } from './zip-import';

import './manage-links.dialog.css';

interface ManageLinksDialogProps {
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
  layerRecord: ILayerImage | undefined;
}

interface IMergedLink {
  protocol?: string;
  url?: string;
  name?: string;
  description?: string;
}

const THUMBNAIL_PROTOCOLS = Object.values(THUMBNAIL_SIZE_TO_PROTOCOL);

const PreviewViewerBridge: React.FC<{
  viewerRef: React.MutableRefObject<CesiumViewer | undefined>;
}> = ({ viewerRef }) => {
  const mapViewer = useCesiumMap();
  useEffect(() => {
    viewerRef.current = mapViewer;
    return () => {
      viewerRef.current = undefined;
    };
  }, [mapViewer, viewerRef]);
  return null;
};

const PreviewInitialFlyTo: React.FC<{ layer: ILayerImage }> = ({ layer }) => {
  const mapViewer = useCesiumMap();
  useEffect(() => {
    const target = computeInitialFlyToTarget(layer);
    if (target) {
      flyPreviewCameraTo(mapViewer, target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

export const ManageLinksDialog: React.FC<ManageLinksDialogProps> = observer(
  ({ isOpen, onSetOpen, layerRecord }) => {
    const store = useStore();
    const intl = useIntl();
    const mutationQuery = useQuery();
    const pendingMergedLinksRef = useRef<IMergedLink[] | null>(null);
    const previewViewerRef = useRef<CesiumViewer | undefined>(undefined);
    const importInputRef = useRef<HTMLInputElement>(null);
    const [isComposingCapture, setIsComposingCapture] = useState(false);
    const [selectedCaptureSize, setSelectedCaptureSize] = useState<CaptureSize>(CaptureSize.SMALL);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isScreenshotContentLoading, setIsScreenshotContentLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [importErrorCode, setImportErrorCode] = useState<ZipImportErrorCode | null>(null);

    const draftLinks = store.discreteLayersStore.draftLinks ?? {};
    const isDirty = Object.keys(draftLinks).length > 0;
    const hasThumbnailDrafts = THUMBNAIL_PROTOCOLS.some((protocol) => !!draftLinks[protocol]);

    const sceneMode =
      layerRecord?.type === RecordType.RECORD_3D
        ? CesiumSceneMode.SCENE3D
        : CesiumSceneMode.SCENE2D;

    const previewLocale = useMemo(
      () => ({ NONE: intl.formatMessage({ id: 'links-management.dialog.no-basemap.text' }) }),
      [intl]
    );

    const previewBaseMaps = useMemo(
      () => withNoCurrentBasemap(store.discreteLayersStore.baseMaps),
      [store.discreteLayersStore.baseMaps]
    );

    const previewLayerElement = useMemo(
      () =>
        layerRecord
          ? generateLayerComponent(layerRecord, store.discreteLayersStore.capabilities, {
              autoZoomTo3D: true,
            })
          : undefined,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [layerRecord?.id, store.discreteLayersStore.capabilities]
    );

    useEffect(() => {
      store.discreteLayersStore.clearDraftLinks();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (
        !mutationQuery.loading &&
        (mutationQuery.data as { updateMetadata?: string } | undefined)?.updateMetadata === 'ok'
      ) {
        if (layerRecord && pendingMergedLinksRef.current) {
          store.actionDispatcherStore.dispatchAction({
            action: UserAction.SYSTEM_CALLBACK_EDIT,
            data: { ...layerRecord, links: pendingMergedLinksRef.current },
          } as IDispatchAction);
        }
        pendingMergedLinksRef.current = null;
        store.discreteLayersStore.clearDraftLinks();
        onSetOpen(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mutationQuery.data]);

    useEffect(() => {
      const viewer = previewViewerRef.current;
      if (!viewer?.screenshot) {
        return;
      }
      if (isComposingCapture) {
        viewer.screenshot.startCapturePreview(THUMBNAIL_CAPTURE_DIMENSIONS[selectedCaptureSize]);
        return viewer.screenshot.onLoadingChange(setIsScreenshotContentLoading);
      }
      viewer.screenshot.stopCapturePreview();
      setIsScreenshotContentLoading(false);
    }, [isComposingCapture, selectedCaptureSize]);

    const handleCaptureConfirm = async (): Promise<void> => {
      const viewer = previewViewerRef.current;
      if (!viewer?.screenshot) {
        return;
      }
      setIsCapturing(true);
      try {
        const dimensions = THUMBNAIL_CAPTURE_DIMENSIONS[selectedCaptureSize];
        const blob = await viewer.screenshot.capture({ ...dimensions, waitForTiles: true });
        const dataUrl = await blobToDataUrl(blob);
        store.discreteLayersStore.setDraftLink(
          THUMBNAIL_SIZE_TO_PROTOCOL[selectedCaptureSize],
          dataUrl
        );
        setIsComposingCapture(false);
      } catch (err) {
        console.error(err);
      } finally {
        setIsCapturing(false);
      }
    };

    const handleExport = async (): Promise<void> => {
      if (!layerRecord || isDirty) return;
      setIsExporting(true);
      try {
        const blob = await exportLayerResourcesZip(layerRecord);
        downloadBlobToClient(blob, `${layerRecord.id}-resources.zip`);
      } catch (err) {
        console.error(err);
      } finally {
        setIsExporting(false);
      }
    };

    const handleImportFileChange = (evt: React.ChangeEvent<HTMLInputElement>): void => {
      const file = evt.target.files?.[0];
      evt.target.value = '';
      if (!file) return;
      setImportErrorCode(null);
      const reader = new FileReader();
      reader.onload = async (): Promise<void> => {
        try {
          const resources = await parseLayerResourcesZip(reader.result as ArrayBuffer);
          resources.forEach((resource) => {
            store.discreteLayersStore.setDraftLink(
              resource.protocol,
              resource.dataUrl,
              resource.fileName
            );
          });
        } catch (err) {
          setImportErrorCode(err instanceof ZipImportError ? err.code : 'invalid-zip');
        }
      };
      reader.readAsArrayBuffer(file);
    };

    const readFileAsDraft =
      (protocol: LinkType) =>
      (evt: React.ChangeEvent<HTMLInputElement>): void => {
        const file = evt.target.files?.[0];
        evt.target.value = '';
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (): void => {
          store.discreteLayersStore.setDraftLink(protocol, reader.result as string, file.name);
        };
        reader.readAsDataURL(file);
      };

    const handleCancel = (): void => {
      store.discreteLayersStore.clearDraftLinks();
      onSetOpen(false);
    };

    const handleSave = (): void => {
      if (!layerRecord) return;
      const draftEntries = Object.values(draftLinks);
      const touchedProtocols = new Set(draftEntries.map((entry) => entry.protocol));
      const mergedLinks: IMergedLink[] = (layerRecord.links ?? [])
        .filter((link) => !touchedProtocols.has(link.protocol as LinkType))
        .map((link) => ({
          protocol: link.protocol,
          url: link.url,
          name: link.name ?? undefined,
          description: link.description ?? undefined,
        }))
        .concat(
          draftEntries.map((entry) => ({
            protocol: entry.protocol,
            url: entry.dataUrl,
            name: entry.fileName,
            description: undefined,
          }))
        );
      pendingMergedLinksRef.current = mergedLinks;
      mutationQuery.setQuery(
        store.mutateUpdateMetadata({
          data: {
            id: layerRecord.id,
            type: layerRecord.type as RecordType,
            partialRecordData: { links: mergedLinks },
          },
        })
      );
    };

    const renderFileSlot = (
      protocol: LinkType,
      accept: string,
      showOpenLink: boolean
    ): JSX.Element => (
      <FileLinkSlot
        accept={accept}
        draft={draftLinks[protocol]}
        existingUrl={getLinkUrlWithToken(layerRecord?.links ?? [], protocol)}
        showOpenLink={showOpenLink}
        onFileChange={readFileAsDraft(protocol)}
        onRemoveChange={(): void => store.discreteLayersStore.removeDraftLink(protocol)}
      />
    );

    return (
      <Box id="manageLinksDialog">
        <Dialog open={isOpen} preventOutsideDismiss={true}>
          <DialogTitle>
            <FormattedMessage id="links-management.dialog.title" />
            <IconButton className="closeIcon mc-icon-Close" label="CLOSE" onClick={handleCancel} />
          </DialogTitle>
          <DialogContent className="dialogBody">
            <Box className="linkSectionsColumn">
              <LinkSection
                titleId="links-management.dialog.thumbnails.section-title"
                icon="image"
                hasChanges={hasThumbnailDrafts}
                defaultOpen
              >
                <ThumbnailsSection
                  layerRecord={layerRecord}
                  draftLinks={draftLinks}
                  isComposingCapture={isComposingCapture}
                  selectedCaptureSize={selectedCaptureSize}
                  isCapturing={isCapturing}
                  isScreenshotContentLoading={isScreenshotContentLoading}
                  onEnterCaptureMode={(): void => setIsComposingCapture(true)}
                  onCancelCapture={(): void => setIsComposingCapture(false)}
                  onSelectCaptureSize={setSelectedCaptureSize}
                  onCaptureConfirm={(): void => void handleCaptureConfirm()}
                  onRemoveChange={(protocol): void =>
                    store.discreteLayersStore.removeDraftLink(protocol)
                  }
                />
              </LinkSection>
              <LinkSection
                titleId="links-management.dialog.legend.section-title"
                icon="layers"
                hasChanges={!!draftLinks[LinkType.LEGEND_IMG]}
              >
                {renderFileSlot(LinkType.LEGEND_IMG, '.png,.bmp,.jpeg,.jpg', false)}
              </LinkSection>
              <LinkSection
                titleId="links-management.dialog.documentation.section-title"
                icon="description"
                hasChanges={!!draftLinks[LinkType.LEGEND_DOC]}
              >
                {renderFileSlot(LinkType.LEGEND_DOC, '.pdf', true)}
              </LinkSection>
            </Box>
            <Box className="previewMapColumn">
              <CesiumMap
                full
                layerManagerMetaMapping={DEFAULT_LAYER_MANAGER_META_MAPPING}
                baseMaps={previewBaseMaps}
                locale={previewLocale}
                sceneMode={sceneMode}
                fullscreenButton={false}
                globeBaseColor={CesiumColor.WHITESMOKE}
                screenshotEnabled
                showDebugger
              >
                <PreviewViewerBridge viewerRef={previewViewerRef} />
                {layerRecord && <PreviewInitialFlyTo key={layerRecord.id} layer={layerRecord} />}
                {previewLayerElement}
              </CesiumMap>
            </Box>
          </DialogContent>
          <DialogActions>
            <Box className="errors">
              <ErrorPresentor errors={formatError(intl, mutationQuery.error, 'error')} />
              {importErrorCode && (
                <Typography tag="div" className="importError">
                  <FormattedMessage
                    id={`links-management.dialog.import-error.${importErrorCode}`}
                  />
                </Typography>
              )}
            </Box>
            <Box className="dialogActionsButtons">
              <input
                ref={importInputRef}
                type="file"
                accept=".zip"
                className="hiddenFileInput"
                onChange={handleImportFileChange}
              />
              <Button outlined type="button" onClick={(): void => importInputRef.current?.click()}>
                <FormattedMessage id="links-management.dialog.import-btn.text" />
              </Button>
              <Tooltip
                content={
                  isDirty
                    ? intl.formatMessage({
                        id: 'links-management.dialog.export-disabled-dirty.tooltip',
                      })
                    : ''
                }
              >
                <span>
                  <Button
                    outlined
                    type="button"
                    disabled={isDirty || isExporting || !layerRecord}
                    onClick={(): void => void handleExport()}
                  >
                    {isExporting ? (
                      <CircularProgress className="loading" />
                    ) : (
                      <FormattedMessage id="links-management.dialog.export-btn.text" />
                    )}
                  </Button>
                </span>
              </Tooltip>
              <Box className="actionsSeparator" />
              <Button type="button" onClick={handleCancel}>
                <FormattedMessage id="general.cancel-btn.text" />
              </Button>
              <Button
                raised
                type="button"
                disabled={mutationQuery.loading || !layerRecord}
                onClick={handleSave}
              >
                {mutationQuery.loading ? (
                  <CircularProgress className="loading" />
                ) : (
                  <FormattedMessage id="general.confirm-btn.text" />
                )}
              </Button>
            </Box>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }
);
