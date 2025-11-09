/* eslint-disable @typescript-eslint/naming-convention */
import React, { useCallback, useEffect, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import { DialogContent } from '@material-ui/core';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogTitle,
  Icon,
  IconButton,
  Tooltip,
  Typography
} from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { GraphQLError } from '../../../common/components/error/graphql.error-presentor';
import { emphasizeByHTML } from '../../../common/helpers/formatters';
import { isUnpublished } from '../../../common/helpers/style';
import { RecordStatus, RecordType, useQuery, useStore } from '../../models';
import { IDispatchAction } from '../../models/actionDispatcherStore';
import { ILayerImage } from '../../models/layerImage';
import { UserAction } from '../../models/userStore';

import './publish.dialog.css';

interface ContinueDialogProps {
  layer: ILayerImage;
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
  onPublish: () => void;
}

export const PublishDialog: React.FC<ContinueDialogProps> = observer(({ layer, isOpen, onSetOpen, onPublish }) => {
  const store = useStore();
  const mutationQuery = useQuery();
  const intl = useIntl();

  const closeDialog = useCallback(() => {
    onSetOpen(false);
  }, [onSetOpen]);

  const publishMessage = useMemo((): string => {
    return intl.formatMessage(
    { id: 'publish-unpublish.dialog.publish.message' },
    { action: emphasizeByHTML(`${intl.formatMessage({ id: 'publish-unpublish.dialog.publish.action' })}`) });
  }, []);

  const unpublishMessage = useMemo((): string => {
    return intl.formatMessage(
    { id: 'publish-unpublish.dialog.unpublish.message' },
    { action: emphasizeByHTML(`${intl.formatMessage({ id: 'publish-unpublish.dialog.unpublish.action' })}`) });
  }, []);

  const dispatchAction = (action: Record<string, unknown>): void => {
    store.actionDispatcherStore.dispatchAction(
      {
        action: action.action,
        data: action.data,
      } as IDispatchAction
    );
  };

  useEffect(() => {
    if (!mutationQuery.loading && ((mutationQuery.data as {updateStatus: string} | undefined)?.updateStatus === 'ok')) {
      onSetOpen(false);
      dispatchAction({ 
        action: UserAction.SYSTEM_CALLBACK_PUBLISH,
        data: {...layer, productStatus: isUnpublished(layer as any) ? RecordStatus.PUBLISHED : RecordStatus.UNPUBLISHED} 
      });
      onPublish();
    }
  }, [mutationQuery.data]);

  const updateStatus = (): void => {
    const productStatus = isUnpublished(layer as any) ? RecordStatus.PUBLISHED : RecordStatus.UNPUBLISHED;
    mutationQuery.setQuery(
      store.mutateUpdateStatus({
        data: {
          id: layer.id,
          type: layer.type as RecordType,
          partialRecordData: { productStatus },
        },
      })
    );
  };
  
  return (
    <Box id="publishDialog">
      <Dialog open={isOpen} preventOutsideDismiss={true}>
        <DialogTitle>
          <FormattedMessage id={ 'general.dialog.exit.title' }/>
          <IconButton
            className="closeIcon mc-icon-Close"
            label="CLOSE"
            onClick={ (): void => { closeDialog(); } }
          />
        </DialogTitle>
        <DialogContent className="dialogBody">
          <Tooltip content={intl.formatMessage({ id: 'general.warning.text' })}>
            <Icon className="icon" icon={{ icon: 'info', size: 'xsmall' }}/>
          </Tooltip>
          <Typography tag="div" dangerouslySetInnerHTML={{__html: isUnpublished(layer as any) ? publishMessage : unpublishMessage}}></Typography>
        </DialogContent>
        <DialogActions>
          <Box className="errors">
            {/* eslint-disable-next-line */}
            <GraphQLError error={mutationQuery.error ?? {}} />
          </Box>
          <Box>
            <Button
              raised
              type="button"
              disabled={mutationQuery.loading || mutationQuery.error !== undefined}
              onClick={(): void => updateStatus()}
            >
              {
                mutationQuery.loading ?
                <CircularProgress className="loading"/> :
                <FormattedMessage id="general.confirm-btn.text"/>
              }
            </Button>
            <Button type="button" onClick={(): void => { closeDialog(); }}>
              <FormattedMessage id="general.cancel-btn.text"/>
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
});
