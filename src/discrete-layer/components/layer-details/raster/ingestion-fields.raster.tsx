import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { isEmpty } from 'lodash';
import { observer } from 'mobx-react';
// import path from 'path';
import { Switch } from '@material-ui/core';
import { Box, defaultFormatters, FileData } from '@map-colonies/react-components';
import { Button, CircularProgress, Icon, Typography } from '@map-colonies/react-core';
import { Selection } from '../../../../common/components/file-picker';
import { FieldLabelComponent } from '../../../../common/components/form/field-label';
import { dateFormatter } from '../../../../common/helpers/formatters';
import { Mode } from '../../../../common/models/mode.enum';
import { RecordType, LayerMetadataMixedUnion, FileType } from '../../../models';
import { FilePickerDialog } from '../../dialogs/file-picker.dialog';
// import { transformEntityToFormFields } from '../utils';
import { RasterWorkflowContext } from './state-machine/context';
import {
  disableUI,
  hasTagDeep
} from './state-machine/helpers';
// import { MOCK_JOB } from './state-machine/MOCK';
import {
  SelectionMode,
  Events,
  // GPKG_PATH,
  IFileBase,
  IFiles,
  // GPKG_LABEL,
  // PRODUCT_LABEL,
  // METADATA_LABEL
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
          isEmpty(state.context?.files) &&
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
  const isLoading = hasTagDeep(actorRef?.getSnapshot());
  const state = RasterWorkflowContext.useSelector((s) => s);
  const filesActor = state.children?.files; // <-- the invoked child
  // const filesState = flowActor?.getSnapshot(); // grab its snapshot

  const [selectionMode, setSelectionMode] = useState<SelectionMode>(state.context.selectionMode as SelectionMode);
  const [isFilePickerDialogOpen, setFilePickerDialogOpen] = useState(false);
  const [selection, setSelection] = useState<Selection>({
    files: [],
    folderChain: [],
    metadata: { recordModel: {} as LayerMetadataMixedUnion, error: null },
  });
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [pendingFileEvent, setPendingFileEvent] = useState<Events | null>(null);
  const [fileType, setFileType] = useState<FileType>();

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
    const eventType = selectionMode === AUTO ? 'MANUAL' : 'AUTO';

    if (!filesActor) {
      actorRef.send({ type: 'RESELECT_FILES' } satisfies Events);
      setPendingFileEvent({ type: eventType });
    } else {
      filesActor.send({ type: eventType } satisfies Events);
    }

    setSelectionMode((prev) => (prev === AUTO ? MANUAL : AUTO));

    /*const job = MOCK_JOB;
    actorRef.send({
      type: 'RESTORE',
      data: {
        flowType: job.type.substring(job.type.lastIndexOf('_') + 1),
        selectionMode: 'restore',
        files: {
          gpkg: {
            label: GPKG_LABEL,
            path: path.resolve(GPKG_PATH, job.parameters.inputFiles.gpkgFilesPath[0]),
            exists: false
          },
          product: {
            label: PRODUCT_LABEL,
            path: path.resolve(GPKG_PATH, job.parameters.inputFiles.productShapefilePath),
            exists: false
          },
          metadata: {
            label: METADATA_LABEL,
            path: path.resolve(GPKG_PATH, job.parameters.inputFiles.metadataShapefilePath),
            exists: false
          }
        },
        resolutionDegree: job.parameters.partsData[0].resolutionDegree,
        formData: {
          ...transformEntityToFormFields(job.parameters.metadata as unknown as LayerMetadataMixedUnion)
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
      <Box className={`ingestionSwitchContainer ${state.context.flowType === Mode.UPDATE ? 'update' : ''} ${isLoading || disableUI(state) ? 'disabled' : ''}`}>
        <Box className="ingestionSwitch">
          <Typography tag="p">
            <FormattedMessage id="switch.auto.text" />
          </Typography>
          <Switch
            checked={isManualMode}
            disabled={isLoading || disableUI(state)}
            onChange={handleSwitchClick} />
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
              {isLoading && <Box className="loadingOnManual"><CircularProgress/></Box>}
              <Button
                raised
                type="button"
                className="manualButton"
                disabled={isLoading || disableUI(state)}
                onClick={() => {
                  setSelectedAction(GPKG);
                  setFilePickerDialogOpen(true);
                  setFileType(FileType.GPKG);
                }}
              >
                <FormattedMessage id="general.choose-btn.text" />
              </Button>
              <Button
                raised
                type="button"
                className="manualButton"
                disabled={isLoading || disableUI(state)}
                onClick={() => {
                  setSelectedAction(PRODUCT);
                  setFilePickerDialogOpen(true);
                  setFileType(FileType.SHP);
                }}
              >
                <FormattedMessage id="general.choose-btn.text" />
              </Button>
              <Button
                raised
                type="button"
                className="manualButton"
                disabled={isLoading || disableUI(state)}
                onClick={() => {
                  setSelectedAction(METADATA);
                  setFilePickerDialogOpen(true);
                  setFileType(FileType.SHP);
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
                disabled={isLoading || disableUI(state)}
                onClick={(): void => {
                  setSelectedAction(FILES);
                  setFilePickerDialogOpen(true);
                  setFileType(FileType.GPKG);
                }}
              >
                <FormattedMessage id="general.choose-btn.text" />
                {isLoading && <Box className="loadingOnAuto"><CircularProgress/></Box>}
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
          fileType={fileType}
        />
      }
    </>
  );
});
