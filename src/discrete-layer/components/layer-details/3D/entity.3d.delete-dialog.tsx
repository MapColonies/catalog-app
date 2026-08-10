import React, { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import { DialogContent } from '@material-ui/core';
import { Button, Checkbox, CircularProgress, DialogActions } from '@map-colonies/react-core';
import { Dialog } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { GraphQLError } from '../../../../common/components/error/graphql.error-presentor';
import { Mode } from '../../../../common/models/mode.enum';
import { getTextStyle } from '../../../../common/helpers/style';
import { RecordType, RootStoreType, useQuery, useStore } from '../../../models';
import { ActionDialogProps } from '../destructive-action-dialog';
import { DialogActionTitle } from '../dialog-action-title';
import { DialogDisclaimer } from '../dialog-disclaimer';
import { GeoJsonMapValuePresentorComponent } from '../field-value-presentors/geojson-map.value-presentor';
import { LayerHeader } from '../layer-header';

import './entity.3d.delete-dialog.css';

type Delete3DLayerResult = Awaited<ReturnType<RootStoreType['mutateDelete3DLayer']>>; // see (MAPCO-11216)

export const EntityDelete3DDialog: React.FC<ActionDialogProps> = observer(
  (props: ActionDialogProps) => {
    const store = useStore();
    const intl = useIntl();
    const mutationQuery = useQuery<Delete3DLayerResult>();
    const [allowDeleting, setAllowDeleting] = useState(false);

    const closeDialog = (): void => {
      props.onSetOpen(false);
    };

    useEffect(() => {
      if (mutationQuery.data && !mutationQuery.error) {
        props.onSuccess?.();
        props.onSetOpen(false);
      }
    }, [mutationQuery.data]);

    const deleteLayer = (): void => {
      mutationQuery.setQuery(
        store.mutateDelete3DLayer({
          data: {
            id: props.layerRecord.id,
            type: props.layerRecord.type as RecordType,
          },
        })
      );
    };

    return (
      <Box id="dialog3DDelete" className="destructiveActionDialog">
        <Dialog open={props.isOpen} preventOutsideDismiss={true}>
          <DialogActionTitle
            recordType={RecordType.RECORD_3D}
            action={Mode.DELETE}
            onClose={closeDialog}
            style={getTextStyle(props.layerRecord as any, 'backgroundColor')}
          />
          <DialogContent>
            <DialogDisclaimer actionId="action.dialog.delete" />
            <LayerHeader layerRecord={props.layerRecord} />
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
