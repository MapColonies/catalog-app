import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import {
  Button,
  Checkbox,
  CircularProgress,
  DialogActions,
  DialogContent,
  Tooltip,
} from '@map-colonies/react-core';
import { Dialog, DialogTitle, Icon, IconButton, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { GraphQLError } from '../../../common/components/error/graphql.error-presentor';
import { emphasizeByHTML } from '../../../common/helpers/formatters';
import { Mode } from '../../../common/models/mode.enum';
import { ILayerImage } from '../../models/layerImage';
import { IDispatchAction } from '../../models/actionDispatcherStore';
import { UserAction } from '../../models/userStore';
import {
  EntityDescriptorModelType,
  RecordStatus,
  RecordType,
  useQuery,
  useStore,
} from '../../models';
import { GeoJsonMapValuePresentorComponent } from './field-value-presentors/geojson-map.value-presentor';
import { LayersDetailsComponent } from './layer-details';

import './entity.delete-dialog.css';

interface EntityDeleteDialogProps {
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
  recordType?: RecordType;
  layerRecord: ILayerImage;
  // recordType?: RecordType;
}

const VALID = 'ok';


interface DeleteTitleProps {
  domain: string;
  action: Mode;
  onClose: () => void;
}

export const DialogsTitle: React.FC<DeleteTitleProps> = (props) => {
  const intl = useIntl();
  const title = intl.formatMessage(
    { id: `general.title.${props.action}` },
    { value: props.domain }
  );

  return (
    <DialogTitle>
      {title}
      <IconButton
        className="closeIcon mc-icon-Close"
        label="CLOSE"
        onClick={(): void => {
          props.onClose();
        }}
      />
    </DialogTitle>
  );
}

export const EntityDeleteDialog: React.FC<EntityDeleteDialogProps> = observer(
  (props: EntityDeleteDialogProps) => {
    const { isOpen, onSetOpen, layerRecord } = props;
    const store = useStore();
    const mutationQuery = useQuery();
    const intl = useIntl();
    const [allowDeleting, setAllowDeleting] = useState(false);

    const [recordType] = useState<RecordType>(
      props.recordType ?? (layerRecord?.type as RecordType)
    );

    const dialogTitleParam = recordType;
    const dialogTitleParamTranslation = intl.formatMessage({
      id: `record-type.${(dialogTitleParam as string).toLowerCase()}.label`,
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

    useEffect(() => {
      if (
        !mutationQuery.loading &&
        (mutationQuery.data as { deleteLayer: string } | undefined)?.deleteLayer === VALID
      ) {
        onSetOpen(false);
        const payload = {
          action: UserAction.SYSTEM_CALLBACK_DELETE,
          data: {
            ...layerRecord,
            productStatus: RecordStatus.BEING_DELETED,
          },
        };

        dispatchAction(payload);
      }
    }, [mutationQuery.data]);

    const deleteLayer = (): void => {
      mutationQuery.setQuery(
        store.mutateDeleteLayer({
          data: {
            id: layerRecord.id,
            type: layerRecord.type as RecordType,
          },
        })
      );
    };

    const warningMessage = useMemo((): string => {
      return intl.formatMessage(
        { id: 'delete.dialog.message' },
        { action: emphasizeByHTML(`${intl.formatMessage({ id: 'delete.dialog.action' })}`) }
      );
    }, []);

    return (
      <Box id="entityDeleteDialog">
        <Dialog open={isOpen} preventOutsideDismiss={true}>
          <DialogsTitle domain={dialogTitleParamTranslation} action={Mode.DELETE} onClose={closeDialog}/>
          <DialogContent>
            <Box className="headerWarning">
                <Icon className="icon" icon={{ icon: 'info', size: 'xsmall' }} />
              <Typography
                tag="div"
                dangerouslySetInnerHTML={{ __html: warningMessage }}
              ></Typography>
            </Box>
            <Box id="deleteLayerDetailsContainer">
              <Box id="deleteLayerDetails">
                <LayersDetailsComponent
                  className="detailsPanelProductView"
                  entityDescriptors={
                    store.discreteLayersStore.entityDescriptors as EntityDescriptorModelType[]
                  }
                  layerRecord={props.layerRecord}
                  isBrief={true}
                  mode={Mode.VIEW}
                />
              </Box>
            </Box>
            <GeoJsonMapValuePresentorComponent
              mode={Mode.VIEW}
              jsonValue={JSON.stringify(props.layerRecord?.footprint)}
              fitOptions={{ padding: [80, 160, 80, 160] }}
              style={{ width: '100%', height: 'var(--map-height)' }}
            />

            <Box className="footer">
              <Checkbox
                checked={allowDeleting}
                label={intl.formatMessage({ id: 'delete.dialog.checkbox' })}
                onChange={(evt: React.MouseEvent<HTMLInputElement>): void => {
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
                  disabled={!allowDeleting || mutationQuery.loading}
                  onClick={deleteLayer}
                >
                  {mutationQuery.loading ? (
                    <CircularProgress className="loading" />
                  ) : (
                    <FormattedMessage id="general.ok-btn.text" />
                  )}
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
      </Box>
    );
  }
);
