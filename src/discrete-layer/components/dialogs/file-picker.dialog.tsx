/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { cloneDeep, get, isEmpty } from 'lodash';
import { observer } from 'mobx-react';
import { DialogContent } from '@material-ui/core';
import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
} from '@map-colonies/react-core';
import {
  Box,
  FileActionData,
  FileData,
  FilePickerActions,
} from '@map-colonies/react-components';
import {
  FilePickerComponent,
  FilePickerComponentHandle,
  Selection,
} from '../../../common/components/file-picker';
import { GraphQLError } from '../../../common/components/error/graphql.error-presentor';
import {
  FileModelType,
  FileType,
  LayerMetadataMixedUnion,
  RecordType,
  useQuery,
  useStore,
} from '../../models';
import { isMultiSelection } from '../layer-details/utils';

import './file-picker.dialog.css';

const EMPTY = 0;
const NUMBER_OF_TEMPLATE_FILES = 4;
const BASE_PATH_SUFFIX = '/';
const AUTO_SELECT_SINGLE_MOUNT = true;

interface FilePickerDialogProps {
  recordType: RecordType;
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
  onFilesSelection: (selected: Selection) => void;
  selection: Selection;
  fetchMetaData?: boolean;
  fileType?: FileType; 
}

const getSuffixFromFolderChain = (folderChain: FileData[]): string => {
  return BASE_PATH_SUFFIX + folderChain.map((file) => file.name.replaceAll('\\', '\\\\')).join('/');
};

export const FilePickerDialog: React.FC<FilePickerDialogProps> = observer(
  ({
    recordType,
    isOpen,
    onSetOpen,
    onFilesSelection,
    selection: currentSelection,
    fetchMetaData=true,
    fileType=undefined
  }) => {
    const filePickerRef = useRef<FilePickerComponentHandle>(null);
    const [files, setFiles] = useState<FileData[]>([]);
    const [isFileSelected, setIsFileSelected] = useState<boolean>(false);
    const [path, setPath] = useState<string>(
      getSuffixFromFolderChain(currentSelection.folderChain)
    );
    const [graphQLError, setGraphQLError] = useState<Record<string, unknown> | null>(null);
    const [selection, setSelection] = useState<Selection>(currentSelection);
    const store = useStore();
    const queryDirectory = useCallback(
      () => useQuery<{ getDirectory: FileModelType[] }>(), [])();
    const queryMetadata = useCallback(
      () => useQuery<{ getFile: LayerMetadataMixedUnion }>(), [])();
    const intl = useIntl();

    useEffect(() => {
      if (files.length === EMPTY || files.some((f: FileData | null) => f !== null)) {
        setFiles(new Array(NUMBER_OF_TEMPLATE_FILES).fill(null));
      }
      queryDirectory.setQuery(
        store.queryGetDirectory({
          data: {
            path,
            type: recordType,
            fileType
          },
        })
      );

      const prevSelection = filePickerRef.current?.getFileSelection();
      setSelection({
        ...prevSelection,
        metadata: {
          recordModel: {} as LayerMetadataMixedUnion,
          error: null,
        },
      } as Selection);
    }, [path]);

    useEffect(() => {
      if (queryDirectory.data) {
        const dirContent = cloneDeep(queryDirectory.data.getDirectory) as FileData[];
        
        const shouldAutoSelectMountDir =
          AUTO_SELECT_SINGLE_MOUNT as boolean &&
          path === BASE_PATH_SUFFIX &&
          dirContent.length === 1 &&
          (dirContent[0].isDir as boolean);

        if (shouldAutoSelectMountDir) {
          void filePickerRef.current?.requestFileAction(
            FilePickerActions.OpenFiles,
            {targetFile: dirContent[0], files:[dirContent[0]]}
          );
        } else {
          setFiles(dirContent);
          if (dirContent.length) {
            const hasMetadata = dirContent.some(
              (file) => file.name === 'metadata.json'
            );
            if (hasMetadata && fetchMetaData) {
              queryMetadata.setQuery(
                store.queryGetFile({
                  data: {
                    path: path + '/metadata.json',
                    type: recordType,
                  },
                })
              );
            }
          }
        }
      }
    }, [queryDirectory.data]);

    useEffect(() => {
      if (typeof queryDirectory.error !== 'undefined') {
        setGraphQLError(queryDirectory.error);
      }
    }, [queryDirectory.error]);

    useEffect(() => {
      if (queryMetadata.data) {
        const prevSelection = filePickerRef.current?.getFileSelection();
        setSelection({
          ...prevSelection,
          metadata: {
            recordModel: cloneDeep(queryMetadata.data.getFile),
            error: null,
          },
        } as Selection);
      }
    }, [queryMetadata.data]);

    useEffect(() => {
      /* eslint-disable */
      if (!isEmpty(get(queryMetadata, "error"))) {
        const metadataError = [
          {
            message: intl.formatMessage({
              id: 'ingestion.error.invalid-metadata',
            }),
          },
          ...queryMetadata.error.response.errors,
        ];

        const queryError = { ...queryMetadata.error };

        queryError.response.errors = metadataError;

        const prevSelection = filePickerRef.current?.getFileSelection();
        
        setSelection({
          ...prevSelection,
          metadata: {
            recordModel: {} as LayerMetadataMixedUnion,
            error: queryError,
          },
        } as Selection);
      }
    /* eslint-enable */
    }, [queryMetadata.error]);

    const closeDialog = useCallback(() => {
      onSetOpen(false);
    }, [onSetOpen]);

    const handleAction = useCallback((data: FileActionData): void => {
      const selected = filePickerRef.current?.getFileSelection() as Selection;
      if (data.id === FilePickerActions.OpenFiles.id) {
        const pathFromChain = getSuffixFromFolderChain(selected.folderChain);
        setPath(pathFromChain);
      } else if (data.id === FilePickerActions.ChangeSelection.id) {
        setIsFileSelected(selected.files.length > EMPTY);
      }
    }, []);

    return (
      <Box id="filePickerDialog">
        <Dialog open={isOpen} preventOutsideDismiss={true}>
          <DialogTitle>
            <FormattedMessage id="general.title.choose" />
            <IconButton
              className="closeIcon mc-icon-Close"
              label="CLOSE"
              onClick={(): void => {
                closeDialog();
              }}
            />
          </DialogTitle>
          <DialogContent className="dialogBody">
            <FilePickerComponent
              ref={filePickerRef}
              files={files}
              selection={selection}
              isMultiSelection={isMultiSelection(recordType)}
              onFileAction={handleAction}
            />
          </DialogContent>
          <DialogActions>
            <Box className="messages">
              <GraphQLError error={graphQLError ?? {}} />
            </Box>
            <Box className="buttons">
              <Button
                raised
                type="button"
                disabled={!isFileSelected}
                onClick={(): void => {
                  onFilesSelection({
                    ...(filePickerRef.current?.getFileSelection() as Selection),
                    metadata: selection.metadata,
                  });
                  closeDialog();
                }}
              >
                <FormattedMessage id="general.ok-btn.text" />
              </Button>
              <Button
                type="button"
                onClick={(): void => {
                  closeDialog();
                }}
              >
                <FormattedMessage id="general.cancel-btn.text" />
              </Button>
            </Box>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }
);
