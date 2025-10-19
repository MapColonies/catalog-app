import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { isEmpty } from 'lodash';
import { observer } from 'mobx-react';
import { Button, Icon, Typography } from '@map-colonies/react-core';
import { Box, defaultFormatters, FileData } from '@map-colonies/react-components';
import { Selection } from '../../../../common/components/file-picker';
import { FieldLabelComponent } from '../../../../common/components/form/field-label';
import { dateFormatter } from '../../../../common/helpers/formatters';
import { RecordType, LayerMetadataMixedUnion } from '../../../models';
import { FilePickerDialog } from '../../dialogs/file-picker.dialog';
import { RasterWorkflowContext } from './state-machine/context';
import { Events, hasLoadingTagDeep, IFileBase, IFiles, WORKFLOW } from './state-machine/state-machine';
import { clearSyncWarnings } from '../utils';

import './ingestion-fields.raster.css';

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

const IngestionInputs: React.FC<{ state: any; }> = ({ state }) => {
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
        {
          <Box className="filesList">
            {
              state.context?.files &&
              Object.values(state.context?.files as IFiles).map((file: IFileBase, idx: number): JSX.Element => {
                return <FileItem key={idx} file={file} />;
              })
            }
          </Box>
        }
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

  const [isFilePickerDialogOpen, setFilePickerDialogOpen] = useState<boolean>(false);
  const [selection, setSelection] = useState<Selection>({
    files: [],
    folderChain: [],
    metadata: { recordModel: {} as LayerMetadataMixedUnion, error: null },
  });
 
  const onFilesSelection = (selected: Selection): void => {
    clearSyncWarnings(true);
    if (selected.files.length) {
      setSelection({ ...selected });
    }
    const directory = selected.files.length ? 
      selected.folderChain
        .map((folder: FileData) => folder.name)
        .join('/')
      : '';
    filesActor?.send({
      type: "SELECT_GPKG", 
      file: {
        label: 'file-name.gpkg',
        path: `${directory}/${selected.files[0].name}`,
        details: { ...selected.files[0] },
        exists: true
      }
    } satisfies Events);
  };

  return (
    <>
      <Box className="header section">
        <Box className="ingestionFields">
          <IngestionInputs state={state} />
        </Box>
        <Box className="ingestionButtonsContainer">
          <Box className="ingestionButton">
            <Button
              raised
              type="button"
              disabled={
                isLoading ||
                !isEmpty(state.context.files) ||
                state.value === WORKFLOW.DONE
              }
              onClick={(): void => {
                setFilePickerDialogOpen(true);
              }}
            >
              <FormattedMessage id="general.choose-btn.text" />
            </Button>
          </Box>
        </Box>
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
