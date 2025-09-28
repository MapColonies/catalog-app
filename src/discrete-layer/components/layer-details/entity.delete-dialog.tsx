import React, { useCallback, useState, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import { Button, Checkbox, DialogContent, Tooltip } from '@map-colonies/react-core';
import { Dialog, DialogTitle, Icon, IconButton, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { emphasizeByHTML } from '../../../common/helpers/formatters';
import { Mode } from '../../../common/models/mode.enum';
import {
  EntityDescriptorModelType,
  RecordType,
  useStore
} from '../../models';
import { ILayerImage } from '../../models/layerImage';
import { GeoJsonMapValuePresentorComponent } from './field-value-presentors/geojson-map.value-presentor';
import { LayersDetailsComponent } from './layer-details';
import './entity.delete-dialog.css';

export const DEFAULT_ID = 'DEFAULT_UI_ID';

interface EntityDeleteDialogProps {
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
  recordType?: RecordType;
  layerRecord?: ILayerImage | null;
}

export const EntityDeleteDialog: React.FC<EntityDeleteDialogProps> = observer(
  (props: EntityDeleteDialogProps) => {

    const { isOpen, onSetOpen, layerRecord } = props;
    const store = useStore();
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
              <Box className="buttons">
                <Button
                  raised
                  type="submit"
                  disabled={!allowDeleting}
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
            </Box>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);
