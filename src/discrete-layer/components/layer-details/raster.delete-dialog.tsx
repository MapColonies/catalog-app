import React, { useState, useRef, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import { Button, CircularProgress, DialogContent, TextField } from '@map-colonies/react-core';
import { Dialog, Icon, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { GraphQLError } from '../../../common/components/error/graphql.error-presentor';
import { Mode } from '../../../common/models/mode.enum';
import {
  EntityDescriptorModelType,
  RecordStatus,
  RecordType,
  useQuery,
  useStore,
} from '../../models';
import { LayersDetailsComponent } from './layer-details';
import { useDeleteLayerDialog, VALID } from './delete-dialog/delete.hook';

import './raster.delete-dialog.css';
import { DialogsTitle, EntityDeleteDialogProps } from './entity.delete-dialog';
import { GeoFeaturesPresentorComponent } from './raster/pp-map';
import { Formik, FormikProps } from 'formik';
import { FieldLabelComponent } from '../../../common/components/form/field-label';
import { UserAction } from '../../models/userStore';

export const RasterDeleteDialog: React.FC<EntityDeleteDialogProps> = observer(
  (props: EntityDeleteDialogProps) => {
    const { isOpen, onSetOpen, layerRecord } = props;
    const store = useStore();
    const intl = useIntl();
    const mutationQuery = useQuery();
    const [allowDeleting, setAllowDeleting] = useState(false);

    const {
      dialogTitleParamTranslation,
      closeDialog,
      dispatchAction,
      warningMessage,
    } = useDeleteLayerDialog({ onSetOpen, layerRecord, recordType: props.recordType });

    useEffect(() => {
      if (
        !mutationQuery.loading &&
        (mutationQuery.data as { deleteLayer: string } | undefined)?.deleteLayer === VALID
      ) {
        onSetOpen(false);
        const payload = {
          action: UserAction.SYSTEM_CALLBACK_DELETE,
          data: { ...layerRecord },
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

    let formikRef = useRef<FormikProps<any>>() as any;

    const [initialDeleteValues, _] = React.useState<any>({ approverCode: '', approverName: '' });

    return (
      <Box id="rasterDeleteDialog">
        <Dialog open={isOpen} preventOutsideDismiss={true}>
          <DialogsTitle
            domain={dialogTitleParamTranslation}
            action={Mode.DELETE}
            onClose={closeDialog}
          />
          <DialogContent>
            <Box className="deleteWarning">
              <Icon className="icon" icon={{ icon: 'info', size: 'xsmall' }} />
              <Typography
                tag="div"
                dangerouslySetInnerHTML={{ __html: warningMessage }}
              ></Typography>
            </Box>
            <Box className="deleteLayerDetailsContainer">
              <Box className="deleteLayerDetails">
                <LayersDetailsComponent
                  entityDescriptors={
                    store.discreteLayersStore.entityDescriptors as EntityDescriptorModelType[]
                  }
                  layerRecord={props.layerRecord}
                  isBrief={true}
                  mode={Mode.VIEW}
                />
              </Box>
            </Box>
            <GeoFeaturesPresentorComponent
              layerRecord={layerRecord}
              mode={Mode.DELETE}
              showPolygonParts={true}
              style={{ height: 'var(--map-height)', position: 'relative', direction: 'ltr' }}
              fitOptions={{ padding: [10, 20, 10, 20] }}
            />

            <Formik
              initialValues={initialDeleteValues}
              enableReinitialize={true}
              innerRef={(instance) => {
                if (instance) {
                  formikRef.current = instance;
                }
              }}
              validateOnMount
              validate={(values) => {
                const errors: any = {};

                if (!values.approverName?.trim()) {
                  errors.approverName = 'Required';
                }

                if (!values.approverCode?.trim()) {
                  errors.approverCode = 'Required';
                }

                return errors;
              }}
              onSubmit={(values, actions) => {
                if (formikRef.current?.isValid) {
                  deleteLayer();
                }
              }}
            >
              {(props) => (
                <form onSubmit={props.handleSubmit}>
                  <Box className="fields">
                    <Box className="field">
                      <FieldLabelComponent
                        value={intl.formatMessage({
                          id: 'delete.approver-name',
                        })}
                        isRequired={true}
                      />
                      <TextField
                        name="approverName"
                        value={props.values.approverName}
                        type="text"
                        required
                        autoComplete="off"
                        onChange={props.handleChange}
                      />
                    </Box>
                    <Box className="field">
                      <FieldLabelComponent
                        value={intl.formatMessage({
                          id: 'delete.approver-code',
                        })}
                        isRequired={true}
                      />
                      <TextField
                        name="approverCode"
                        value={props.values.approverCode}
                        type="password"
                        required
                        autoComplete="off"
                        onChange={props.handleChange}
                      />
                    </Box>
                  </Box>
                  <Box className="footer">
                    <Box className="errors">
                      <GraphQLError error={mutationQuery.error ?? {}} />
                    </Box>
                    <Box className="buttons">
                      <Button
                        raised
                        type="submit"
                        disabled={!props.isValid || mutationQuery.loading}
                        // onClick={() => formikRef.current?.submitForm()}
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
                    </Box>
                  </Box>
                </form>
              )}
            </Formik>
          </DialogContent>
        </Dialog>
      </Box>
    );
  }
);
