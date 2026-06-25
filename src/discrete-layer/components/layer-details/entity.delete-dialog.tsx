import React, { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import {
  Button,
  Checkbox,
  CircularProgress,
  DialogActions,
  DialogContent,
} from '@map-colonies/react-core';
import { Dialog, DialogTitle, Icon, IconButton, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { GraphQLError } from '../../../common/components/error/graphql.error-presentor';
import { Mode } from '../../../common/models/mode.enum';
import { ILayerImage } from '../../models/layerImage';
import {
  EntityDescriptorModelType,
  RecordStatus,
  RecordType,
  useQuery,
  useStore,
} from '../../models';
import { GeoJsonMapValuePresentorComponent } from './field-value-presentors/geojson-map.value-presentor';
import { LayersDetailsComponent } from './layer-details';
import { useDeleteLayerDialog, VALID } from './delete-dialog/delete.hook';

import './entity.delete-dialog.css';
import { UserAction } from '../../models/userStore';

export interface EntityDeleteDialogProps {
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
  recordType?: RecordType;
  layerRecord: ILayerImage;
  // recordType?: RecordType;
}

export interface DeleteTitleProps {
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
};

export const EntityDeleteDialog: React.FC<EntityDeleteDialogProps> = observer(
  (props: EntityDeleteDialogProps) => {
    const { isOpen, onSetOpen, layerRecord } = props;
    const store = useStore();
    const intl = useIntl();
    const mutationQuery = useQuery();
    const [allowDeleting, setAllowDeleting] = useState(false);

    const { dialogTitleParamTranslation, closeDialog, dispatchAction, warningMessage } =
      useDeleteLayerDialog({ onSetOpen, layerRecord, recordType: props.recordType });

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
        store.mutateDelete3DLayer({
          data: {
            id: layerRecord.id,
            type: layerRecord.type as RecordType,
          },
        })
      );
    };

    return (
      <Box id="entityDeleteDialog">
        <Dialog open={isOpen} preventOutsideDismiss={true}>
          <DialogsTitle
            domain={dialogTitleParamTranslation}
            action={Mode.DELETE}
            onClose={closeDialog}
          />
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
