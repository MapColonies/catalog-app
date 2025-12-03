import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { isEmpty } from 'lodash';
import { observer } from 'mobx-react';
import { Switch } from '@material-ui/core';
import { Box, defaultFormatters, FileData } from '@map-colonies/react-components';
import { Button, Icon, Typography } from '@map-colonies/react-core';
import { Selection } from '../../../../common/components/file-picker';
import { FieldLabelComponent } from '../../../../common/components/form/field-label';
import CONFIG from '../../../../common/config';
import { dateFormatter, formatPath, relativeDateFormatter } from '../../../../common/helpers/formatters';
import { Mode } from '../../../../common/models/mode.enum';
import { RecordType, LayerMetadataMixedUnion, RasterIngestionFilesTypeConfig } from '../../../models';
import { FilePickerDialog } from '../../dialogs/file-picker.dialog';
import { Curtain } from './curtain/curtain.component';
import { RasterWorkflowContext } from './state-machine/context';
import {
  hasActiveJob,
  hasTagDeep,
  isModified,
  isRetryEnabled,
  isUIDisabled
} from './state-machine/helpers';
import {
  SelectionMode,
  Events,
  IFiles,
  IContext
} from './state-machine/types';

import './ingestion-fields.raster.css';

const AUTO: SelectionMode = 'auto';
const MANUAL: SelectionMode = 'manual';
const FILES = 'files';
const DATA = 'data';
const PRODUCT = 'product';
const SHAPEMETADATA = 'shapeMetadata';

interface IngestionFieldsProps {
  recordType: RecordType;
}

const FileItem: React.FC<{ file: any; context: IContext }> = ({ file, context }) => {
  const color = !file.exists ? 'error' : (file.isModDateDiffExceeded ? 'warning' : '');
  const modDate = file.details?.modDate;

  return (
    <>
      <Box>
        <Icon className="fileIcon mc-icon-Map-Vector" />
      </Box>
      <FormattedMessage id={file.label} />
      <Box className={`fileItemName ${color}`}>
        {formatPath(file.path)}
      </Box>
      <Box className={`ltr ${color}`}>
        {defaultFormatters.formatFileSize(null, file.details)}
      </Box>
      <Box className={`ltr ${color}`}>
        {
          modDate
          ? (isModified(modDate) && isRetryEnabled(context)
            ? file.dateFormatterPredicate(modDate)
            : dateFormatter(modDate))
          : ''
        }
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
            Object.values(state.context?.files as IFiles).map((file: any, idx: number): JSX.Element => {
              return <FileItem key={idx} file={file} context={state.context} />;
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
  const [IngestionFilesTypeConfig, setIngestionFilesTypeConfig] = useState<RasterIngestionFilesTypeConfig>();


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
        const actionTypeMap: Record<string, { type: 'SELECT_FILES' | 'SELECT_DATA' | 'SELECT_PRODUCT' | 'SELECT_SHAPEMETADATA', predicate: (modeDate: Date | string) => string }> = {
          files: { type: 'SELECT_FILES', predicate: dateFormatter },
          data: { type: 'SELECT_DATA', predicate: dateFormatter },
          product: { type: 'SELECT_PRODUCT', predicate: relativeDateFormatter },
          shapeMetadata: { type: 'SELECT_SHAPEMETADATA', predicate: relativeDateFormatter },
        };
        const event = actionTypeMap[selectedAction];
        const fileEvent = {
          type: event.type,
          file: {
            label: `file-name.${selectedAction}`,
            path: `${directory}/${selected.files[0].name}`,
            details: { ...selected.files[0] },
            exists: true,
            dateFormatterPredicate: event.predicate
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
  };

  return (
    <>
      {
        CONFIG.SHOW_SELECTION_MODE_SWITCH &&
        hasActiveJob(state.context) === false &&
        (selectionMode === AUTO || selectionMode === MANUAL) &&
        <Box className={`ingestionSwitchContainer ${state.context.flowType === Mode.UPDATE ? 'update' : ''} ${isUIDisabled(isLoading, state) ? 'disabled' : ''}`}>
          <Box className="ingestionSwitch">
            <Typography tag="p">
              <FormattedMessage id="switch.auto.text" />
            </Typography>
            <Switch
              checked={selectionMode === MANUAL}
              disabled={isUIDisabled(isLoading, state)}
              onChange={handleSwitchClick} />
            <Typography tag="p">
              <FormattedMessage id="switch.manual.text" />
            </Typography>
          </Box>
        </Box>
      }
      <Box className={`header section ${isLoading ? 'curtainContainer' : ''}`}>
        {
          isLoading && <Curtain showProgress={isLoading}/>
        }
        <Box className="ingestionFields">
          <IngestionInputs state={state} />
        </Box>
        {
          hasActiveJob(state.context) === false &&
          selectionMode === MANUAL &&
          <Box className="ingestionManualButtons">
            <Button
              raised
              type="button"
              className="manualButton"
              disabled={isUIDisabled(isLoading, state)}
              onClick={() => {
                setSelectedAction(DATA);
                setFilePickerDialogOpen(true);
                setIngestionFilesTypeConfig(RasterIngestionFilesTypeConfig.DATA);
              }}
            >
              <FormattedMessage id="general.choose-btn.text" />
            </Button>
            <Button
              raised
              type="button"
              className="manualButton"
              disabled={isUIDisabled(isLoading, state)}
              onClick={() => {
                setSelectedAction(PRODUCT);
                setFilePickerDialogOpen(true);
                setIngestionFilesTypeConfig(RasterIngestionFilesTypeConfig.PRODUCT);
              }}
            >
              <FormattedMessage id="general.choose-btn.text" />
            </Button>
            <Button
              raised
              type="button"
              className="manualButton"
              disabled={isUIDisabled(isLoading, state)}
              onClick={() => {
                setSelectedAction(SHAPEMETADATA);
                setFilePickerDialogOpen(true);
                setIngestionFilesTypeConfig(RasterIngestionFilesTypeConfig.SHAPEMETADATA);
              }}
            >
              <FormattedMessage id="general.choose-btn.text" />
            </Button>
          </Box>
        }
        {
          hasActiveJob(state.context) === false &&
          selectionMode === AUTO &&
          <Box className="ingestionAutoButtons">
            <Button
              raised
              type="button"
              className="autoButton"
              disabled={isUIDisabled(isLoading, state)}
              onClick={(): void => {
                setSelectedAction(FILES);
                setFilePickerDialogOpen(true);
                setIngestionFilesTypeConfig(RasterIngestionFilesTypeConfig.DATA);
              }}
            >
              <FormattedMessage id="general.choose-btn.text" />
            </Button>
          </Box>
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
          rasterIngestionFilesTypeConfig={IngestionFilesTypeConfig}
        />
      }
    </>
  );
});
