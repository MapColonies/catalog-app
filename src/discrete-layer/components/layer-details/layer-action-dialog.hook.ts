import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { emphasizeByHTML } from '../../../common/helpers/formatters';
import { ILayerImage } from '../../models/layerImage';
import { IDispatchAction } from '../../models/actionDispatcherStore';
import { RecordType, useStore } from '../../models';

interface LayerActionDialogOptions {
  layerRecord: ILayerImage;
  onSetOpen: (open: boolean) => void;
  recordType?: RecordType;
  disclaimerActionId?: string;
}

export const useLayerActionDialog = ({
  layerRecord,
  onSetOpen,
  recordType: recordTypeProp,
  disclaimerActionId = 'action.dialog.delete',
}: LayerActionDialogOptions) => {
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

  const disclaimer = useMemo((): string => {
    return intl.formatMessage(
      { id: 'action.dialog.disclaimer' },
      { action: emphasizeByHTML(`${intl.formatMessage({ id: disclaimerActionId })}`) }
    );
  }, [disclaimerActionId]);

  return {
    recordType,
    dialogTitleParamTranslation,
    closeDialog,
    dispatchAction,
    disclaimer,
  };
};
