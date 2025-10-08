/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable array-callback-return */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { observer } from 'mobx-react';
import { FormikValues } from 'formik';
import { Button, Icon, Typography } from '@map-colonies/react-core';
import { Box, defaultFormatters, FileData } from '@map-colonies/react-components';
import { Selection } from '../../../../common/components/file-picker';
import { FieldLabelComponent } from '../../../../common/components/form/field-label';
import { dateFormatter } from '../../../../common/helpers/formatters';
import { Mode } from '../../../../common/models/mode.enum';
import { RecordType, LayerMetadataMixedUnion } from '../../../models';
import { FilePickerDialog } from '../../dialogs/file-picker.dialog';
import { StringValuePresentorComponent } from '../field-value-presentors/string.value-presentor';
import { IRecordFieldInfo } from '../layer-details.field-info';
import { EntityFormikHandlers } from '../layer-datails-form';
import { Events, hasLoadingTagDeep, IFileBase, IFiles } from './state-machine.raster';
import { RasterWorkflowContext } from './state-machine-context.raster';
import { clearSyncWarnings } from '../utils';

import './ingestion-fields.raster.css';

interface IngestionFieldsProps {
  recordType: RecordType;
  fields: IRecordFieldInfo[];
  values: FormikValues;
  isError: boolean;
  onErrorCallback: (open: boolean) => void;
  formik?: EntityFormikHandlers;
  manageMetadata?: boolean;
}

const FileItem: React.FC<{ file: IFileBase }> = ({ file }) => {
  return (
    <>
      <Box><Icon className="fileIcon mc-icon-Map-Vector" /></Box>
      <Box className={file?.exists ? 'fileItemName' : 'fileItemName warning'}>
        {file?.path?.startsWith('/\\') ? file?.path?.substring(1) : file?.path}
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

const IngestionInputs: React.FC<{
  fields: IRecordFieldInfo[];
  values: string[];
  formik: EntityFormikHandlers;
  state: any;
}> = ({ fields, values, formik, state }) => {
  return (
    <>
      {
        fields.slice(1).map((field: IRecordFieldInfo, index: number) => {
          return (
            <Box className="ingestionField" key={field.fieldName}>
              <FieldLabelComponent
                value={field.label}
                isRequired={true}
                customClassName={`${field.fieldName as string}Spacer`}
              />
              <Box className="detailsFieldValue">
                {
                  values[index] === '' &&
                  <Typography tag="span" className="disabledText">
                    {'<'}
                    <FormattedMessage id="general.empty.text" />
                    {'>'}
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
              <Box className="hiddenField">
                <StringValuePresentorComponent
                  mode={Mode.NEW}
                  fieldInfo={field}
                  // @ts-ignore
                  value={formik.getFieldProps(field.fieldName).value as string}
                  formik={formik}
                />
              </Box>
            </Box>
          );
        })
      }
    </>
  );
};

export const IngestionFields: React.FC<IngestionFieldsProps> = observer(({
  recordType,
  fields,
  values,
  isError,
  onErrorCallback,
  formik,
  manageMetadata=true,
}) => {
  const actorRef = RasterWorkflowContext.useActorRef();
  const isLoading = hasLoadingTagDeep(actorRef?.getSnapshot());
  const state = RasterWorkflowContext.useSelector((s) => s);
  const flowActor = state.children?.flow; // <-- the invoked child
  const flowState = flowActor?.getSnapshot(); // grab its snapshot

  useEffect(() => {
    console.log("**** workflowMachine_STATE[<IngestionFields>] *****", state.value);
    console.log("**** flowMachine_STATE *****", flowState?.value);
    // if (flowState?.matches("selectGpkg")) {
    //   setFilePickerDialogOpen(true);
    // }
  }, [state.value, flowState]);

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
    flowActor?.send({
      type: "SELECT_GPKG", 
      file: {
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
          <IngestionInputs
            fields={fields}
            values={[values.directory, values.fileNames]}
            formik={formik as EntityFormikHandlers}
            state={state}
          />
        </Box>
        <Box className="ingestionButtonsContainer">
          <Box className="ingestionButton">
            <Button
              raised
              type="button"
              disabled={isLoading}
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
          fetchMetaData={manageMetadata}
        />
      }
    </>
  );
});
