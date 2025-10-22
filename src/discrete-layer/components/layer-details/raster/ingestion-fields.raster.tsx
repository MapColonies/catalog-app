import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { observer } from 'mobx-react';
// import path from 'path';
import { Switch } from '@material-ui/core';
import { Box, defaultFormatters, FileData } from '@map-colonies/react-components';
import { Button, Icon, Typography } from '@map-colonies/react-core';
import { Selection } from '../../../../common/components/file-picker';
import { FieldLabelComponent } from '../../../../common/components/form/field-label';
import { dateFormatter } from '../../../../common/helpers/formatters';
import { RecordType, LayerMetadataMixedUnion } from '../../../models';
import { FilePickerDialog } from '../../dialogs/file-picker.dialog';
import { RasterWorkflowContext } from './state-machine/context';
// import { hasLoadingTagDeep } from './state-machine/helpers';
import {
  SelectionMode,
  Events,
  // GPKG_PATH,
  IFileBase,
  IFiles,
  // WORKFLOW
} from './state-machine/types';

import './ingestion-fields.raster.css';

const AUTO: SelectionMode = 'auto';
const MANUAL: SelectionMode = 'manual';
const FILES = 'files';
const GPKG = 'gpkg';
const PRODUCT = 'product';
const METADATA = 'metadata';

interface IngestionFieldsProps {
  recordType: RecordType;
}

const FileItem: React.FC<{ file: IFileBase }> = ({ file }) => {
  return (
    <>
      <Box><Icon className="fileIcon mc-icon-Map-Vector" /></Box>
      <FormattedMessage id={file.label} />
      <Box className={`fileItemName ${file.exists ? '' : 'warning'}`}>
        {file.path?.startsWith('/\\') ? file.path?.substring(1) : file.path}
      </Box>
      <Box className="ltr">
        {defaultFormatters.formatFileSize(null, file.details as FileData)}
      </Box>
      <Box className="ltr">
        {file.details?.modDate ? dateFormatter(file.details.modDate, true) : ''}
      </Box>
    </>
  );
};

const IngestionInputs: React.FC<{ state: any }> = ({ state }) => {
  return (
    <Box className="ingestionField">
      <FieldLabelComponent value={'field-names.ingestion.fileNames'} />
      <Box className="detailsFieldValue">
        {
          !state.context?.files &&
          <Typography tag="span" className="empty disabledText">
            {'<'}<FormattedMessage id="general.empty.text" />{'>'}
          </Typography>
        }
        <Box className="filesList">
          {
            state.context?.files &&
            Object.values(state.context?.files as IFiles).map((file: IFileBase, idx: number): JSX.Element => {
              return <FileItem key={idx} file={file} />;
            })
          }
        </Box>
      </Box>
    </Box>
  );
};

export const IngestionFields: React.FC<IngestionFieldsProps> = observer(({ recordType }) => {
  const actorRef = RasterWorkflowContext.useActorRef();
  // const isLoading = hasLoadingTagDeep(actorRef?.getSnapshot());
  const state = RasterWorkflowContext.useSelector((s) => s);
  const filesActor = state.children?.files; // <-- the invoked child
  // const flowState = flowActor?.getSnapshot(); // grab its snapshot

  const [selectionMode, setSelectionMode] = useState<SelectionMode>(AUTO);
  const [isFilePickerDialogOpen, setFilePickerDialogOpen] = useState(false);
  const [selection, setSelection] = useState<Selection>({
    files: [],
    folderChain: [],
    metadata: { recordModel: {} as LayerMetadataMixedUnion, error: null },
  });
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [pendingFileEvent, setPendingFileEvent] = useState<Events | null>(null);

  useEffect(() => {
    if (pendingFileEvent && filesActor) {
      filesActor.send(pendingFileEvent);
      setPendingFileEvent(null); // clear
    }
  }, [filesActor, pendingFileEvent]);

  const onFilesSelection = (selected: Selection): void => {
    if (selected.files.length) {
      setSelection({ ...selected });
      
      const directory = selected.files.length
        ? selected.folderChain.map((folder: FileData) => folder.name).join('/')
        : '';

      if (selectedAction) {
        const actionTypeMap: Record<string, 'SELECT_FILES' | 'SELECT_GPKG' | 'SELECT_PRODUCT' | 'SELECT_METADATA'> = {
          files: 'SELECT_FILES',
          gpkg: 'SELECT_GPKG',
          product: 'SELECT_PRODUCT',
          metadata: 'SELECT_METADATA',
        };
        const eventType = actionTypeMap[selectedAction];
        const fileEvent = {
          type: eventType,
          file: {
            label: `file-name.${selectedAction}`,
            path: `${directory}/${selected.files[0].name}`,
            details: { ...selected.files[0] },
            exists: true
          }
        } satisfies Events;

        if (!filesActor) {
          actorRef.send({ type: 'RESELECT_FILES' } satisfies Events);
          setPendingFileEvent(fileEvent); // wait for child actor
        } else {
          filesActor.send(fileEvent);
        }
      }
    }
  };

  const handleSwitchClick = (): void => {
    if (selectionMode === AUTO) {
      filesActor.send({ type: 'MANUAL' } satisfies Events);
    } else {
      filesActor.send({ type: 'AUTO' } satisfies Events);
    }

    setSelectionMode((prev) => (prev === AUTO ? MANUAL : AUTO));

    /*const job = {
      "__typename": "Job",
      "id": "8b62987a-c1f7-4326-969e-ceca4c81b5aa",
      "resourceId": "elicy_test",
      "version": "1.0",
      "description": "",
      "parameters": {
          "metadata": {
              "srs": "4326",
              "grid": "2x1",
              "region": [
                  "אלגיריה"
              ],
              "srsName": "WGS84GEO",
              "catalogId": "025d4fc6-3a01-4c6e-9606-e99fa12d185b",
              "productId": "elicy_test",
              "displayPath": "efb28079-6781-4c68-b4d0-d8ddfd8da42b",
              "productName": "elicy_test",
              "productType": "Orthophoto",
              "producerName": "IDFMU",
              "tileMimeType": "image/png",
              "transparency": "TRANSPARENT",
              "classification": "4",
              "tileOutputFormat": "PNG",
              "layerRelativePath": "025d4fc6-3a01-4c6e-9606-e99fa12d185b/efb28079-6781-4c68-b4d0-d8ddfd8da42b"
          },
          "partsData": [
            {
              "sensors": [
                "WV02"
              ],
              "sourceId": "10300500B7F94C00",
              "footprint": {
                "bbox": [
                  34.453125,
                  35.67305400967598,
                  34.456225633621216,
                  35.68359375
                ],
                "type": "Polygon",
                "coordinates": [
                  [
                    [
                      34.45506289601326,
                      35.6808565557003
                    ],
                    [
                      34.453125,
                      35.67305400967598
                    ],
                    [
                      34.456225633621216,
                      35.68359375
                    ],
                    [
                      34.453125,
                      35.68359375
                    ],
                    [
                      34.45461764931679,
                      35.68273410201073
                    ],
                    [
                      34.45506289601326,
                      35.6808565557003
                    ]
                  ]
                ]
              },
              "sourceName": "Cyprus_after_model22.3",
              "resolutionMeter": 1222.99,
              "resolutionDegree": 0.010986328125,
              "imagingTimeEndUTC": "2021-06-27T09:00:00.000Z",
              "imagingTimeBeginUTC": "2021-06-27T09:00:00.000Z",
              "sourceResolutionMeter": 0.48,
              "horizontalAccuracyCE90": 8.5
            }
          ],
          "inputFiles": {
              "fileNames": [
                  "blueMarble.gpkg"
              ],
              "originDirectory": "test_dir"
          },
          "additionalParams": {
              "jobTrackerServiceURL": "http://raster-core-int-job-tracker-service"
          }
      },
      "status": "Failed",
      "reason": "GPKG source /layerSources/ingestion-source/test_dir/blueMarble.gpkg does not exist.",
      "type": "Ingestion_New",
      "percentage": 75,
      "priority": 1000,
      "expirationDate": "1970-01-01T00:00:00.000Z",
      "internalId": "025d4fc6-3a01-4c6e-9606-e99fa12d185b",
      "producerName": null,
      "productName": "elicy_test",
      "productType": "ORTHOPHOTO",
      "created": "2025-09-29T06:32:43.694Z",
      "updated": "2025-09-29T08:40:52.442Z",
      "taskCount": 8,
      "completedTasks": 6,
      "failedTasks": 2,
      "expiredTasks": 0,
      "pendingTasks": 0,
      "inProgressTasks": 0,
      "isCleaned": false,
      "domain": "RASTER",
      "availableActions": null
    };
    actorRef.send({
      type: 'RESTORE',
      data: {
        flowType: job.type.substring(job.type.lastIndexOf('_') + 1),
        selectionMode: 'auto',
        files: {
          gpkg: {
            label: 'file-name.gpkg',
            path: path.resolve(GPKG_PATH, job.parameters.inputFiles.gpkgFilesPath[0]),
            exists: false
          },
          product: {
            label: 'file-name.product',
            path: path.resolve(GPKG_PATH, job.parameters.inputFiles.productShapefilePath),
            exists: false
          },
          metadata: {
            label: 'file-name.metadata',
            path: path.resolve(GPKG_PATH, job.parameters.inputFiles.metadataShapefilePath),
            exists: false
          }
        },
        resolutionDegree: job.parameters.partsData[0].resolutionDegree,
        formData: {
          ...job.parameters.metadata
        },
        job: {
          jobId: job.id,
          taskId: '3fa85f64-5717-4562-b3fc-2c963f66afa6'
        }
      }
    } satisfies Events);*/
  };

  const isManualMode = selectionMode === MANUAL;

  return (
    <>
      <Box className="ingestionSwitchContainer">
        <Box className="ingestionSwitch">
          <Typography tag="p">
            <FormattedMessage id="switch.auto.text" />
          </Typography>
          <Switch checked={isManualMode} onChange={handleSwitchClick} />
          <Typography tag="p">
            <FormattedMessage id="switch.manual.text" />
          </Typography>
        </Box>
      </Box>
      <Box className="header section">
        <Box className="ingestionFields">
          <IngestionInputs state={state} />
        </Box>
        {
          isManualMode ? (
            <Box className="ingestionManualButtons">
              <Button
                raised
                type="button"
                className="manualButton"
                // disabled={isLoading}
                onClick={() => {
                  setSelectedAction(GPKG);
                  setFilePickerDialogOpen(true);
                }}
              >
                <FormattedMessage id="general.choose-btn.text" />
              </Button>
              <Button
                raised
                type="button"
                className="manualButton"
                // disabled={isLoading}
                onClick={() => {
                  setSelectedAction(PRODUCT);
                  setFilePickerDialogOpen(true);
                }}
              >
                <FormattedMessage id="general.choose-btn.text" />
              </Button>
              <Button
                raised
                type="button"
                className="manualButton"
                // disabled={isLoading}
                onClick={() => {
                  setSelectedAction(METADATA);
                  setFilePickerDialogOpen(true);
                }}
              >
                <FormattedMessage id="general.choose-btn.text" />
              </Button>
            </Box>
          ) : (
            <Box className="ingestionAutoButtons">
              <Button
                raised
                type="button"
                className="autoButton"
                // disabled={
                //   isLoading ||
                //   state.value === WORKFLOW.DONE
                // }
                onClick={(): void => {
                  setSelectedAction(FILES);
                  setFilePickerDialogOpen(true);
                }}
              >
                <FormattedMessage id="general.choose-btn.text" />
              </Button>
            </Box>
          )
        }
      </Box>
      {
        isFilePickerDialogOpen &&
        <FilePickerDialog
          recordType={recordType}
          isOpen={isFilePickerDialogOpen}
          onSetOpen={setFilePickerDialogOpen}
          onFilesSelection={onFilesSelection}
          selection={selection}
        />
      }
    </>
  );
});
