/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { get, isFunction } from 'lodash';
import { useTheme } from '@map-colonies/react-core';
import {
  FileActionData,
  FileData,
  FilePicker,
  FilePickerAction,
  FilePickerActions,
  FilePickerHandle,
  SupportedLocales,
} from '@map-colonies/react-components';
import { LayerMetadataMixedUnion } from '../../../discrete-layer/models';
import CONFIG from '../../config';

const NOT_FOUND = -1;
const START = 0;

export interface MetadataFile {
  recordModel: LayerMetadataMixedUnion;
  error: unknown;
}
export interface FilePickerComponentHandle {
  getFileSelection: () => Selection;
  setFileSelection: (selection: Set<string>, reset?: boolean) => void;
  requestFileAction: <Action extends FilePickerAction>(
    action: Action,
    payload: Action['__payloadType']
  ) => Promise<void>;
}

export interface Selection {
  files: FileData[];
  folderChain: FileData[];
  metadata?: MetadataFile;
}

interface FilePickerComponentProps {
  files: FileData[];
  selection: Selection;
  isMultiSelection: boolean;
  onFileAction?: (data: FileActionData) => void;
}

export const FilePickerComponent = React.forwardRef<
  FilePickerComponentHandle,
  FilePickerComponentProps
>(
  (
    { files, selection: currentSelection, isMultiSelection, onFileAction },
    ref
  ) => {
    const theme = useTheme();
    const fpRef = useRef<FilePickerHandle>(null);
    const [selection, setSelection] = useState<Selection>(currentSelection);

    useImperativeHandle(ref, () => ({
      getFileSelection(): Selection {
        return selection;
      },
      setFileSelection(selection, reset = true): void {
        return fpRef.current?.setFileSelection(selection, reset);
      },
      async requestFileAction<Action extends FilePickerAction>(
        action: Action,
        payload: Action['__payloadType']
      ): Promise<void> {
        return fpRef.current?.requestFileAction(action, payload);
      },
    }));

    useEffect(() => {
      const selectedFiles = new Set(
        currentSelection.files.map((file) => file.id)
      );
      fpRef.current?.setFileSelection(selectedFiles, false);
    }, [currentSelection, files]);

    const handleAction = (data: FileActionData): void => {
      flushSync(() => {
        if (data.id === FilePickerActions.OpenFiles.id) {
          const { targetFile, files } = data.payload;
          const fileToOpen = targetFile ?? files[0];
          if (fileToOpen.isDir === true) {
            setSelection((currentSelection) => {
              const newSelection = { ...currentSelection };
              const index = newSelection.folderChain.findIndex(
                (file) => file.id === fileToOpen.id
              );
              if (index > NOT_FOUND) {
                newSelection.folderChain = [
                  ...newSelection.folderChain.slice(START, index + 1),
                ];
              } else {
                newSelection.folderChain = [
                  ...newSelection.folderChain,
                  fileToOpen,
                ];
              }
              return newSelection;
            });
          }
        } else if (data.id === FilePickerActions.ChangeSelection.id) {
          setSelection((currentSelection) => {
            const selectedIds =
              fpRef.current?.getFileSelection() as Set<string>;

            if (!isMultiSelection && selectedIds.size > 1) {
              fpRef.current?.setFileSelection(
                new Set(currentSelection.files.map((file) => file.id))
              );
              return currentSelection;
            } else {
              const newSelection = { ...currentSelection };
              newSelection.files = files.filter((file: FileData) =>
                selectedIds.has(get(file, 'id'))
              );
              return newSelection;
            }
          });
        }
      });

      if (isFunction(onFileAction)) {
        onFileAction(data);
      }
    };

    return (
      <FilePicker
        ref={fpRef}
        theme={{
          primary: theme.primary as string,
          background: theme.background as string,
          surface: theme.surface as string,
          textOnBackground: theme.textSecondaryOnBackground as string,
          selectionBackground: theme.custom?.GC_SELECTION_BACKGROUND as string,
        }}
        readOnlyMode={true}
        locale={
          SupportedLocales[
            CONFIG.I18N.DEFAULT_LANGUAGE.toUpperCase() as keyof typeof SupportedLocales
          ]
        }
        files={files}
        folderChain={selection.folderChain}
        onFileAction={handleAction}
      />
    );
  }
);
