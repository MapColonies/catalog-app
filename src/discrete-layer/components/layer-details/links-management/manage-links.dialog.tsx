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
  CesiumMap,
  CesiumSceneMode,
  CesiumViewer,
  IBaseMaps,
  useCesiumMap,
} from '@map-colonies/react-components';
import { GraphQLError } from '../../../../common/components/error/graphql.error-presentor';
import { Hyperlink } from '../../../../common/components/hyperlink/hyperlink';
import { LinkType } from '../../../../common/models/link-type.enum';
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
  buildPreviewBaseMaps,
  CaptureSize,
  computeInitialFlyToTarget,
  flyPreviewCameraTo,
  THUMBNAIL_CAPTURE_DIMENSIONS,
  THUMBNAIL_SIZE_TO_PROTOCOL,
} from './links-management.utils';
import { CaptureAreaOverlay } from './capture-area-overlay';
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

const THUMBNAIL_SIZES = [CaptureSize.SMALL, CaptureSize.MEDIUM, CaptureSize.LARGE];

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
    const legendFileInputRef = useRef<HTMLInputElement>(null);
    const documentationFileInputRef = useRef<HTMLInputElement>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const previewViewerRef = useRef<CesiumViewer | undefined>(undefined);
    const importInputRef = useRef<HTMLInputElement>(null);
    const [isComposingCapture, setIsComposingCapture] = useState(false);
    const [selectedCaptureSize, setSelectedCaptureSize] = useState<CaptureSize>(CaptureSize.SMALL);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [importErrorCode, setImportErrorCode] = useState<ZipImportErrorCode | null>(null);
    const [expandedSections, setExpandedSections] = useState({
      thumbnails: true,
      legend: false,
      documentation: false,
    });

    const draftLinks = store.discreteLayersStore.draftLinks ?? {};
    const isDirty = Object.keys(draftLinks).length > 0;

    const sceneMode =
      layerRecord?.type === RecordType.RECORD_3D
        ? CesiumSceneMode.SCENE3D
        : CesiumSceneMode.SCENE2D;

    const previewBaseMaps = useMemo<IBaseMaps | undefined>(
      () =>
        buildPreviewBaseMaps(
          store.discreteLayersStore.baseMaps,
          intl.formatMessage({ id: 'links-management.dialog.no-basemap.text' })
        ),
      [store.discreteLayersStore.baseMaps, intl]
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

    const toggleSection = (section: keyof typeof expandedSections): void => {
      setExpandedSections({ ...expandedSections, [section]: !expandedSections[section] });
    };

    const handleCaptureConfirm = async (): Promise<void> => {
      const viewer = previewViewerRef.current;
      if (!viewer?.screenshot) {
        return;
      }
      setIsCapturing(true);
      try {
        const dimensions = THUMBNAIL_CAPTURE_DIMENSIONS[selectedCaptureSize];
        const blob = await viewer.screenshot.capture(dimensions);
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

    const renderThumbnailSlot = (size: CaptureSize): JSX.Element => {
      const protocol = THUMBNAIL_SIZE_TO_PROTOCOL[size];
      const draft = draftLinks[protocol];
      const existingUrl = getLinkUrlWithToken(layerRecord?.links ?? [], protocol);
      const previewUrl = draft?.dataUrl ?? existingUrl;
      const { width, height } = THUMBNAIL_CAPTURE_DIMENSIONS[size];

      return (
        <Box key={size} className="linkSlot thumbnailSlot">
          <Box className="linkSlotPreview">
            {previewUrl ? (
              <img src={previewUrl} alt={size} />
            ) : (
              <Typography tag="span" className="emptyState">
                <FormattedMessage id="links-management.dialog.empty-state.text" />
              </Typography>
            )}
          </Box>
          <Typography tag="div" className="linkSlotLabel">
            {`${size} (${width}×${height})`}
          </Typography>
          {(draft || existingUrl) && (
            <Typography tag="div" className={draft ? 'statusChanged' : 'statusSaved'}>
              <FormattedMessage
                id={
                  draft
                    ? 'links-management.dialog.changed.text'
                    : 'links-management.dialog.saved.text'
                }
              />
            </Typography>
          )}
          {draft && (
            <Box className="linkSlotActions">
              <Button
                type="button"
                onClick={(): void => store.discreteLayersStore.removeDraftLink(protocol)}
              >
                <FormattedMessage id="links-management.dialog.remove-change-btn.text" />
              </Button>
            </Box>
          )}
        </Box>
      );
    };

    const renderThumbnailsSection = (): JSX.Element => {
      if (isComposingCapture) {
        return (
          <Box className="captureComposeControls">
            <Typography tag="div" className="captureComposeHint">
              <FormattedMessage id="links-management.dialog.capture-hint.text" />
            </Typography>
            <Box className="captureSizeRadioGroup">
              {THUMBNAIL_SIZES.map((size) => {
                const dims = THUMBNAIL_CAPTURE_DIMENSIONS[size];
                return (
                  <label key={size} className="captureSizeRadio">
                    <input
                      type="radio"
                      name="captureSize"
                      checked={selectedCaptureSize === size}
                      onChange={(): void => setSelectedCaptureSize(size)}
                    />
                    <Typography tag="span">{`${size} (${dims.width}×${dims.height})`}</Typography>
                  </label>
                );
              })}
            </Box>
            <Box className="linkSlotActions">
              <Button
                type="button"
                disabled={isCapturing}
                onClick={(): void => setIsComposingCapture(false)}
              >
                <FormattedMessage id="general.cancel-btn.text" />
              </Button>
              <Button
                raised
                type="button"
                disabled={isCapturing}
                onClick={(): void => void handleCaptureConfirm()}
              >
                {isCapturing ? (
                  <CircularProgress className="loading" />
                ) : (
                  <FormattedMessage id="links-management.dialog.capture-btn.text" />
                )}
              </Button>
            </Box>
          </Box>
        );
      }
      return (
        <>
          <Box className="thumbnailsRow">{THUMBNAIL_SIZES.map(renderThumbnailSlot)}</Box>
          <Button type="button" onClick={(): void => setIsComposingCapture(true)}>
            <FormattedMessage id="links-management.dialog.capture-thumbnail-btn.text" />
          </Button>
        </>
      );
    };

    const renderFileSlot = (
      protocol: LinkType,
      accept: string,
      inputRef: React.RefObject<HTMLInputElement>,
      showOpenLink: boolean
    ): JSX.Element => {
      const draft = draftLinks[protocol];
      const existingUrl = getLinkUrlWithToken(layerRecord?.links ?? [], protocol);
      const displayName =
        draft?.fileName ?? (existingUrl ? existingUrl.split('/').pop() : undefined);

      return (
        <Box className="linkSlot fileSlot">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hiddenFileInput"
            onChange={readFileAsDraft(protocol)}
          />
          {displayName ? (
            <Typography tag="div" className="fileName" dir="ltr">
              {displayName}
            </Typography>
          ) : (
            <Typography tag="span" className="emptyState">
              <FormattedMessage id="links-management.dialog.empty-state.text" />
            </Typography>
          )}
          {(draft || existingUrl) && (
            <Typography tag="div" className={draft ? 'statusChanged' : 'statusSaved'}>
              <FormattedMessage
                id={
                  draft
                    ? 'links-management.dialog.changed.text'
                    : 'links-management.dialog.saved.text'
                }
              />
            </Typography>
          )}
          <Box className="linkSlotActions">
            {showOpenLink && existingUrl && !draft && (
              <Hyperlink className="openLink" url={existingUrl}>
                <FormattedMessage id="links-management.dialog.open-btn.text" />
              </Hyperlink>
            )}
            <Button type="button" onClick={(): void => inputRef.current?.click()}>
              <FormattedMessage id="links-management.dialog.replace-btn.text" />
            </Button>
            {draft && (
              <Button
                type="button"
                onClick={(): void => store.discreteLayersStore.removeDraftLink(protocol)}
              >
                <FormattedMessage id="links-management.dialog.remove-change-btn.text" />
              </Button>
            )}
          </Box>
        </Box>
      );
    };

    return (
      <Box id="manageLinksDialog">
        <Dialog open={isOpen} preventOutsideDismiss={true}>
          <DialogTitle>
            <FormattedMessage id="links-management.dialog.title" />
            <IconButton className="closeIcon mc-icon-Close" label="CLOSE" onClick={handleCancel} />
          </DialogTitle>
          <DialogContent className="dialogBody">
            <div className="previewMapColumn" ref={mapContainerRef}>
              <CesiumMap
                full
                layerManagerMetaMapping={DEFAULT_LAYER_MANAGER_META_MAPPING}
                baseMaps={previewBaseMaps}
                sceneMode={sceneMode}
                fullscreenButton={false}
                screenshotEnabled
              >
                <PreviewViewerBridge viewerRef={previewViewerRef} />
                {layerRecord && <PreviewInitialFlyTo key={layerRecord.id} layer={layerRecord} />}
                {previewLayerElement}
              </CesiumMap>
              {isComposingCapture && (
                <CaptureAreaOverlay
                  containerRef={mapContainerRef}
                  targetDimensions={THUMBNAIL_CAPTURE_DIMENSIONS[selectedCaptureSize]}
                />
              )}
            </div>
            <Box className="linkSectionsColumn">
              <Box className="linkSection">
                <Box
                  className="linkSectionHeader"
                  onClick={(): void => toggleSection('thumbnails')}
                >
                  <Typography tag="div">
                    <FormattedMessage id="links-management.dialog.thumbnails.section-title" />
                  </Typography>
                </Box>
                {expandedSections.thumbnails && (
                  <Box className="linkSectionBody">{renderThumbnailsSection()}</Box>
                )}
              </Box>
              <Box className="linkSection">
                <Box className="linkSectionHeader" onClick={(): void => toggleSection('legend')}>
                  <Typography tag="div">
                    <FormattedMessage id="links-management.dialog.legend.section-title" />
                  </Typography>
                </Box>
                {expandedSections.legend && (
                  <Box className="linkSectionBody">
                    {renderFileSlot(
                      LinkType.LEGEND_IMG,
                      '.png,.bmp,.jpeg,.jpg',
                      legendFileInputRef,
                      false
                    )}
                  </Box>
                )}
              </Box>
              <Box className="linkSection">
                <Box
                  className="linkSectionHeader"
                  onClick={(): void => toggleSection('documentation')}
                >
                  <Typography tag="div">
                    <FormattedMessage id="links-management.dialog.documentation.section-title" />
                  </Typography>
                </Box>
                {expandedSections.documentation && (
                  <Box className="linkSectionBody">
                    {renderFileSlot(LinkType.LEGEND_DOC, '.pdf', documentationFileInputRef, true)}
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Box className="errors">
              {/* eslint-disable-next-line */}
              <GraphQLError error={mutationQuery.error ?? {}} />
              {importErrorCode && (
                <Typography tag="div" className="statusChanged">
                  <FormattedMessage
                    id={`links-management.dialog.import-error.${importErrorCode}`}
                  />
                </Typography>
              )}
            </Box>
            <Box>
              <input
                ref={importInputRef}
                type="file"
                accept=".zip"
                className="hiddenFileInput"
                onChange={handleImportFileChange}
              />
              <Button type="button" onClick={(): void => importInputRef.current?.click()}>
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
