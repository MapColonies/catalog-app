import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { observer } from 'mobx-react';
import { Switch } from '@material-ui/core';
import { Box, defaultFormatters, FileData } from '@map-colonies/react-components';
import { Button, Icon, Typography } from '@map-colonies/react-core';
import { Selection } from '../../../../common/components/file-picker';
import { FieldLabelComponent } from '../../../../common/components/form/field-label';
import { dateFormatter } from '../../../../common/helpers/formatters';
import { RecordType, LayerMetadataMixedUnion } from '../../../models';
import { FilePickerDialog } from '../../dialogs/file-picker.dialog';
import { RasterWorkflowContext } from './state-machine/context';
import { hasLoadingTagDeep } from './state-machine/helpers';
import { AutoMode, Events, IFileBase, IFiles, WORKFLOW } from './state-machine/types';

import './ingestion-fields.raster.css';

const AUTO: AutoMode = 'auto';
const MANUAL: AutoMode = 'manual';
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
  const isLoading = hasLoadingTagDeep(actorRef?.getSnapshot());
  const state = RasterWorkflowContext.useSelector((s) => s);
  const filesActor = state.children?.files; // <-- the invoked child
  // const flowState = flowActor?.getSnapshot(); // grab its snapshot

  const [autoMode, setAutoMode] = useState<AutoMode>(AUTO);
  const [isFilePickerDialogOpen, setFilePickerDialogOpen] = useState(false);
  const [selection, setSelection] = useState<Selection>({
    files: [],
    folderChain: [],
    metadata: { recordModel: {} as LayerMetadataMixedUnion, error: null },
  });
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const onFilesSelection = (selected: Selection): void => {
    if (selected.files.length) {
      setSelection({ ...selected });
      
      const directory = selected.files.length
        ? selected.folderChain.map((folder: FileData) => folder.name).join('/')
        : '';

      if (selectedAction) {
        const actionTypeMap: Record<string, 'SELECT_GPKG' | 'SELECT_PRODUCT' | 'SELECT_METADATA'> = {
          gpkg: 'SELECT_GPKG',
          product: 'SELECT_PRODUCT',
          metadata: 'SELECT_METADATA',
        };
        const eventType = actionTypeMap[selectedAction];
        if (eventType) {
          filesActor?.send({
            type: eventType,
            file: {
              label: `file-name.${selectedAction}`,
              path: `${directory}/${selected.files[0].name}`,
              details: { ...selected.files[0] },
              exists: true
            }
          } satisfies Events);
        }
      }
    }
  };

  const handleSwitchClick = (): void => {
    setAutoMode((prev) => (prev === MANUAL ? AUTO : MANUAL));
    if (autoMode === AUTO) {
      actorRef.send({ type: 'MANUAL' } satisfies Events);
    } else {
      actorRef.send({ type: 'AUTO' } satisfies Events);
    }
  };

  const isManualMode = autoMode === MANUAL;

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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={
                  isLoading ||
                  state.value === WORKFLOW.DONE
                }
                onClick={(): void => {
                  setSelectedAction(GPKG);
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
