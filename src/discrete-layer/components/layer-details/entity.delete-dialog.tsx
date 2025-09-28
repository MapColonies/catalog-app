import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import { Button, Checkbox, CircularProgress, DialogActions, DialogContent, Tooltip } from '@map-colonies/react-core';
import { Dialog, DialogTitle, Icon, IconButton, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { emphasizeByHTML } from '../../../common/helpers/formatters';
import { Mode } from '../../../common/models/mode.enum';
import {
  EntityDescriptorModelType,
  RecordType,
  useQuery,
  useStore
} from '../../models';
import { ILayerImage } from '../../models/layerImage';
import { GeoJsonMapValuePresentorComponent } from './field-value-presentors/geojson-map.value-presentor';
import { LayersDetailsComponent } from './layer-details';
import './entity.delete-dialog.css';
import { IDispatchAction } from '../../models/actionDispatcherStore';
import { UserAction } from '../../models/userStore';
import { GraphQLError } from '../../../common/components/error/graphql.error-presentor';

export const DEFAULT_ID = 'DEFAULT_UI_ID';

interface EntityDeleteDialogProps {
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
  recordType?: RecordType;
  layerRecord: ILayerImage;
}

export const EntityDeleteDialog: React.FC<EntityDeleteDialogProps> = observer(
  (props: EntityDeleteDialogProps) => {

    const { isOpen, onSetOpen, layerRecord } = props;
    const store = useStore();
    const mutationQuery = useQuery();
    const intl = useIntl();
    const [allowDeleting, setAllowDeleting] = useState(false);

    const [recordType] = useState<RecordType>(props.recordType ?? (layerRecord?.type as RecordType));

    const dialogTitleParam = recordType;
    const dialogTitleParamTranslation = intl.formatMessage({
      id: `record-type.${(dialogTitleParam as string).toLowerCase()}.label`,
    });

    const dialogTitle = intl.formatMessage(
      { id: `general.title.delete` },
      { value: dialogTitleParamTranslation }
    );

    const closeDialog = useCallback(() => {
      onSetOpen(false);
    }, [onSetOpen, store.discreteLayersStore]);

    const dispatchAction = (action: Record<string, unknown>): void => {
      store.actionDispatcherStore.dispatchAction(
        {
          action: action.action,
          data: action.data,
        } as IDispatchAction
      );
    };

    useEffect(() => {
      if (!mutationQuery.loading && ((mutationQuery.data as { deleteLayer: string } | undefined)?.deleteLayer === 'ok')) {
        onSetOpen(false);
        dispatchAction({
          action: UserAction.ENTITY_ACTION_LAYER3DRECORD_DELETE,
          data: { ...layerRecord, }
        });
      }
    }, [mutationQuery.data]);

    const deleteLayer = (): void => {
      mutationQuery.setQuery(
        store.mutateDelete3DLayer({
          data: {
            id: layerRecord.id,
            type: layerRecord.type as RecordType
          },
        })
      );
    };

    const deleteMessage = useMemo((): string => {
      return intl.formatMessage(
        { id: 'delete.dialog.message' },
        { action: emphasizeByHTML(`${intl.formatMessage({ id: 'delete.dialog.action' })}`) });
    }, []);

    const UpdateLayerHeader = (): JSX.Element => {
      return (
        <>
          <DialogContent className="headerWarning">
            <Tooltip content={intl.formatMessage({ id: 'general.warning.text' })}>
              <Icon className="icon" icon={{ icon: 'info', size: 'xsmall' }} />
            </Tooltip>
            <Typography tag='div' dangerouslySetInnerHTML={{ __html: deleteMessage }}></Typography>
          </DialogContent>
          <Box id="deleteLayerHeader">
            <Box id="deleteLayerHeaderContent">
              <LayersDetailsComponent
                className="detailsPanelProductView"
                entityDescriptors={
                  store.discreteLayersStore
                    .entityDescriptors as EntityDescriptorModelType[]
                }
                layerRecord={props.layerRecord}
                isBrief={true}
                mode={Mode.VIEW}
              />
            </Box>
          </Box>
        </>
      );
    };

    return (
      <div id="entityDeleteDialog">
        <Dialog open={isOpen} preventOutsideDismiss={true}>
          <DialogTitle>
            {dialogTitle}
            <IconButton
              className="closeIcon mc-icon-Close"
              label="CLOSE"
              onClick={(): void => {
                closeDialog();
              }}
            />
          </DialogTitle>
          <DialogContent>
            {<UpdateLayerHeader />}
            <GeoJsonMapValuePresentorComponent
              mode={Mode.VIEW}
              jsonValue={JSON.stringify(props.layerRecord?.footprint)}
              fitOptions={{ padding: [80, 160, 80, 160] }}
              style={{ width: '100%', height: '480px' }}
            />

            <Box className="footer">
              <Box className="messages">
              </Box>
              <Checkbox
                checked={allowDeleting}
                label={intl.formatMessage({ id: 'delete.dialog.checkbox' })}
                onChange={
                  (evt: React.MouseEvent<HTMLInputElement>): void => {
                    setAllowDeleting(evt.currentTarget.checked);
                  }}
              />
              <DialogActions className="buttons">
                <Box className="errors">
                  <GraphQLError error={mutationQuery.error ?? {}} />
                </Box>
                <Button
                  raised
                  type="submit"
                  disabled={!allowDeleting}
                  onClick={deleteLayer}
                >
                  {
                    mutationQuery.loading ?
                      <CircularProgress className="loading" /> :
                      <FormattedMessage id="general.ok-btn.text" />
                  }
                </Button>
                <Button
                  type="button"
                  onClick={(): void => {
                    closeDialog();
                  }}
                >
                  <FormattedMessage id="general.cancel-btn.text" />
                </Button>
              </DialogActions>
            </Box>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);
