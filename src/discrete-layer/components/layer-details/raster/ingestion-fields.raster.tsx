/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable array-callback-return */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React, { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import { FormikValues } from 'formik';
import { cloneDeep, isEmpty } from 'lodash';
import { Button, CircularProgress, Icon, Typography } from '@map-colonies/react-core';
import { Box, defaultFormatters, FileData } from '@map-colonies/react-components';
import { Selection } from '../../../../common/components/file-picker';
import { FieldLabelComponent } from '../../../../common/components/form/field-label';
// import useSessionStoreWatcherDirectory from '../../../common/hooks/useSessionStoreWatcherDirectory';
import { Mode } from '../../../../common/models/mode.enum';
import { MetadataFile } from '../../../../common/components/file-picker';
import { RecordType, LayerMetadataMixedUnion, useQuery, useStore, SourceValidationModelType } from '../../../models';
import { FilePickerDialog } from '../../dialogs/file-picker.dialog';
import { LayerRasterRecordModelKeys} from '../entity-types-keys';
import { StringValuePresentorComponent } from '../field-value-presentors/string.value-presentor';
import { IRecordFieldInfo } from '../layer-details.field-info';
import { EntityFormikHandlers, FormValues } from '../layer-datails-form';
import { clearSyncWarnings, importJSONFileFromClient } from '../utils';
import { Events, hasLoadingTagDeep, IFileBase } from './state-machine.raster';
import { RasterWorkflowContext } from './state-machine-context.raster';

import '../ingestion-fields.css';

interface IngestionFieldsProps {
  recordType: RecordType;
  fields: IRecordFieldInfo[];
  values: FormikValues;
  isError: boolean;
  onErrorCallback: (open: boolean) => void;
  validateSources?: boolean;
  reloadFormMetadata?: (
    ingestionFields: FormValues,
    metadata: MetadataFile,
    removePrevData?: boolean
  ) => void;
  formik?: EntityFormikHandlers;
  manageMetadata?: boolean;
}

const FileItem: React.FC<{ file: IFileBase }> = ({ file }) => {
  return (
    <>
      <Box><Icon className="fileIcon mc-icon-Map-Vector" /></Box>
      <Box className='fileItemName'>{file.path}</Box>
      <Box style={{ direction: 'ltr' }}>
        {defaultFormatters.formatFileSize(null, file.details as FileData)}
      </Box>
    </>
  );
};

const IngestionInputs: React.FC<{
  fields: IRecordFieldInfo[];
  values: string[];
  selection: Selection;
  formik: EntityFormikHandlers;
  state: any;
}> = ({ fields, values, selection, formik, state }) => {
  return (
    <>
      {
        fields.map((field: IRecordFieldInfo, index: number) => {
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
                      state.context?.files?.values?.map((file: IFileBase, idx: number): JSX.Element | undefined => {
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

export const IngestionFields: React.FC<PropsWithChildren<IngestionFieldsProps>> = observer(({
  recordType,
  fields,
  values,
  isError,
  onErrorCallback,
  validateSources=false,
  reloadFormMetadata,
  formik,
  children,
  manageMetadata=true,
}) => {
  const intl = useIntl();
  const store = useStore();

  const actorRef = RasterWorkflowContext.useActorRef();
  const isLoading = hasLoadingTagDeep(actorRef?.getSnapshot());
  const state = RasterWorkflowContext.useSelector((s) => s);

  const flowActor = state.children?.flow; // <-- the invoked child
  const flowState = flowActor?.getSnapshot(); // grab its snapshot

  useEffect(() => {
    console.log("**** workflowMachine_STATE[<IngestionFields>] *****", state.value);
    console.log("**** flowMachine_STATE *****", flowState?.value);

    if (flowState?.matches("selectGpkg")) {
      setFilePickerDialogOpen(true);
    }
  }, [state.value, flowState]);

  const [isFilePickerDialogOpen, setFilePickerDialogOpen] = useState<boolean>(false);
  const [isImportDisabled, setIsImportDisabled] = useState(true);
  const [selection, setSelection] = useState<Selection>({
    files: [],
    folderChain: [],
    metadata: { recordModel: {} as LayerMetadataMixedUnion, error: null },
  });
  const [chosenMetadataFile, setChosenMetadataFile] = useState<string | null>(null); 
  const [chosenMetadataError, setChosenMetadataError] = useState<{response: { errors: { message: string }[] }} | null>(null); 

  const queryResolveMetadataAsModel = useQuery<{ resolveMetadataAsModel: LayerMetadataMixedUnion}>();
  const queryValidateSource = useQuery<{validateSource: SourceValidationModelType[]}>();
  // const directoryComparisonWarn = useSessionStoreWatcherDirectory();

  const handleError = useCallback((error: boolean) => {
    onErrorCallback(error);
  }, [onErrorCallback]);

  useEffect(() => {
    if (chosenMetadataFile !== null) {
      queryResolveMetadataAsModel.setQuery(
        store.queryResolveMetadataAsModel(
          {
            data: {
              metadata: chosenMetadataFile,
              type: recordType
            }
          }
        )
      )
    }
  }, [chosenMetadataFile]);

  useEffect(() => {
    if (queryResolveMetadataAsModel.data) {
      const metadataAsModel = cloneDeep(queryResolveMetadataAsModel.data.resolveMetadataAsModel);

      if (reloadFormMetadata) {
        reloadFormMetadata(
          {
            directory: values.directory as string,
            fileNames: values.fileNames as string,
          },
          { recordModel: metadataAsModel} as MetadataFile
        );
      }
    }
  }, [queryResolveMetadataAsModel.data]);

  useEffect(() => {
    if (!isEmpty(queryResolveMetadataAsModel.error) || !isEmpty(chosenMetadataError)) {
      if (reloadFormMetadata) {
        reloadFormMetadata(
          {
            directory: values.directory as string,
            fileNames: values.fileNames as string,
          },
          { recordModel: {}, error: chosenMetadataError ?? (queryResolveMetadataAsModel.error as unknown)} as MetadataFile
        );
      }
    }
  }, [queryResolveMetadataAsModel.error, chosenMetadataError]);

  const ONLY_ONE_SOURCE = 0;
  useEffect(() => {
    setIsImportDisabled(
      !selection.files.length || 
      queryResolveMetadataAsModel.loading || 
      queryValidateSource.loading || 
      isError ||
      (!queryValidateSource.loading && queryValidateSource.data?.validateSource[ONLY_ONE_SOURCE].isValid === false));
  }, [selection, queryResolveMetadataAsModel.loading, queryValidateSource.loading, isError]);

  useEffect(() => {
    if (queryValidateSource.data) {
      const directory = selection.files.length ? 
      selection.folderChain
          .map((folder: FileData) => folder.name)
          .join('/')
      : '';          
      const fileNames = selection.files.map((file: FileData) => file.name).join(',');
      if (queryValidateSource.data?.validateSource[ONLY_ONE_SOURCE].isValid === false) {
        if (reloadFormMetadata) {
          reloadFormMetadata(
            {
              directory: values.directory as string,
              fileNames: values.fileNames as string,
            },
            {
              recordModel: {},
              error: {
                response: {
                  errors: [
                    {
                      message: intl.formatMessage(
                        { id: 'ingestion.error.invalid-source-file' },
                        { value: queryValidateSource.data.validateSource[ONLY_ONE_SOURCE].message }
                      ),
                    },
                  ],
                },
              }
            } as MetadataFile
          );
        }
        handleError(true);
      }
      else {
        if (reloadFormMetadata) {
          reloadFormMetadata(
            {
              directory: directory,
              fileNames: fileNames,
            },
            {
              recordModel:{
                ...selection.metadata?.recordModel,
                ...queryValidateSource.data?.validateSource[ONLY_ONE_SOURCE],
                resolutionDegreeMaxValue: queryValidateSource.data?.validateSource[ONLY_ONE_SOURCE]["resolutionDegree"],
              },
              error: selection.metadata?.error
            }  as unknown as MetadataFile
          );
        }
        handleError(false);
      }
    }
  }, [selection, queryValidateSource.data]);

  useEffect(() => {
    if (queryValidateSource.error) {
      if (reloadFormMetadata) {
        const directory = selection.files.length ? 
        selection.folderChain
            .map((folder: FileData) => folder.name)
            .join('/')
        : '';          
        const fileNames = selection.files.map((file: FileData) => file.name).join(',');
        reloadFormMetadata(
          {
            directory: directory as string,
            fileNames: fileNames as string,
          },
          {
            recordModel: {},
            error: queryValidateSource.error,
          } as MetadataFile
        );
      }
      handleError(true);
    }
  }, [queryValidateSource.error]);

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
    const fileNames = selected.files.map((file: FileData) => file.name);

    if (validateSources) {
      flowActor?.send({
        type: "SELECT_GPKG", 
        file: {
          path: `${directory}/${selected.files[0].name}`,
          details: { ...selected.files[0] },
          exists: true
        }
      } satisfies Events);
      queryValidateSource.setQuery(
        store.queryValidateSource(
          {
            data: {
              originDirectory: directory,
              fileNames: fileNames,
              type: recordType,
            }
          },
          undefined,
          {
            fetchPolicy: 'no-cache'
          }
        )
      )
    }
    if (reloadFormMetadata) {
      reloadFormMetadata(
        {
          directory: directory,
          fileNames: fileNames.join(','),
        },
        selected.metadata as MetadataFile,
        true // ONLY WHEN (RE-)SELECTING FILE, removePrevData should be TRUE
      );
    }
  };

  const checkIsValidMetadata = useCallback((record: Record<string, unknown>): boolean => {
    let recordKeys = LayerRasterRecordModelKeys as string[];
    return Object.keys(record).every(key => {
      return recordKeys.includes(key)
    });
  }, []);

  return (
    <>
      <Box className="header section">
        <Box className="ingestionFields">
          <IngestionInputs
            fields={fields}
            values={[values.directory, values.fileNames]}
            selection={selection}
            formik={formik as EntityFormikHandlers}
            state={state}
            // notSynchedDirWarning={directoryComparisonWarn}
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
          {
            manageMetadata && 
            <Box className="uploadMetadataButton">
              <Button
                outlined
                type="button"
                disabled={isImportDisabled}
                onClick={(): void => {
                  importJSONFileFromClient((e) => {
                    const resultFromFile = JSON.parse(
                      e.target?.result as string
                    ) as Record<string, unknown>;
                    setChosenMetadataFile(null);
                    setChosenMetadataError(null);

                    if (checkIsValidMetadata(resultFromFile)) {
                      setChosenMetadataFile(e.target?.result as string);
                    } else {
                      setChosenMetadataError({
                        response: {
                          errors: [
                            {
                              message: `Please choose metadata for product ${recordType}`,
                            },
                          ],
                        },
                      });
                    }
                  });
                }}
              >
                {queryResolveMetadataAsModel.loading ? (
                  <CircularProgress />
                ) : (
                  <FormattedMessage id="ingestion.button.import-metadata" />
                )}
              </Button>
            </Box>
          }
          <Box>
            {children}
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
