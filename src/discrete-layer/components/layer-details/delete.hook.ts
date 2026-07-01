import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { emphasizeByHTML } from '../../../common/helpers/formatters';
import { ILayerImage } from '../../models/layerImage';
import { IDispatchAction } from '../../models/actionDispatcherStore';
import { RecordType, useStore } from '../../models';

export const VALID = 'ok';

interface DeleteLayerDialogOptions {
  onSetOpen: (open: boolean) => void;
  layerRecord: ILayerImage;
  recordType?: RecordType;
}

export const useDeleteLayer = ({
  onSetOpen,
  layerRecord,
  recordType: recordTypeProp,
}: DeleteLayerDialogOptions) => {
  const store = useStore();

  const intl = useIntl();

  const [recordType] = useState<RecordType>(recordTypeProp ?? (layerRecord?.type as RecordType));

  const dialogTitleParamTranslation = intl.formatMessage({
    id: `record-type.${(recordType as string).toLowerCase()}.label`,
  });

  const closeDialog = useCallback(() => {
    onSetOpen(false);
  }, [onSetOpen, store.discreteLayersStore]);

  const dispatchAction = (action: Record<string, unknown>): void => {
    store.actionDispatcherStore.dispatchAction({
      action: action.action,
      data: action.data,
    } as IDispatchAction);
  };

  const warningMessage = useMemo((): string => {
    return intl.formatMessage(
      { id: 'delete.dialog.message' },
      { action: emphasizeByHTML(`${intl.formatMessage({ id: 'delete.dialog.action' })}`) }
    );
  }, []);

  return {
    recordType,
    dialogTitleParamTranslation,
    closeDialog,
    dispatchAction,
    warningMessage,
  };
};
