import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import {
  Button,
  Checkbox,
  CircularProgress,
  DialogActions,
  DialogContent,
  TextField,
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
import { LayersDetailsComponent } from './layer-details';

import './raster.delete-dialog.css';
import { DialogsTitle } from './entity.delete-dialog';
import { GeoFeaturesPresentorComponent } from './raster/pp-map';
import { Formik, FormikProps } from 'formik';
import { FieldLabelComponent } from '../../../common/components/form/field-label';

interface EntityDeleteDialogProps {
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
  recordType?: RecordType;
  layerRecord: ILayerImage;
  // recordType?: RecordType;
}

const VALID = 'ok';

export const RasterDeleteDialog: React.FC<EntityDeleteDialogProps> = observer(
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

    const formRef = useRef<HTMLFormElement>(null);

    let formikRef = useRef<FormikProps<any>>() as any;

    useEffect(() => {
      console.log('formikRef.isVaild', formikRef.isVaild)
    }, [formikRef.isVaild])


    const [filterValues, setFilterValues] = React.useState<any>({ approverCode: '', approverName: '' });

    return (
      <Box id="rasterDeleteDialog">
        <Dialog open={isOpen} preventOutsideDismiss={true}>
          <DialogsTitle domain={dialogTitleParamTranslation} action={Mode.DELETE} onClose={closeDialog} />
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
              initialValues={filterValues}
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
                setAllowDeleting(formRef.current?.checkValidity() ?? false);
                deleteLayer();
              }}
            >
              {(props) => (
                <form onSubmit={props.handleSubmit}>
                  <Box className='fields'>
                    <Box className='field'>
                      <FieldLabelComponent
                        value={intl.formatMessage({
                          id: 'delete.approver-name',
                        })}
                        isRequired={true}
                      />
                      <TextField
                        name='approverName'
                        value={props.values.approverName}
                        type='text'
                        required
                        autoComplete='off'
                        onChange={props.handleChange}
                      />
                    </Box>
                    <Box className='field'>
                      <FieldLabelComponent
                        value={intl.formatMessage({
                          id: 'delete.approver-code',
                        })}
                        isRequired={true}
                      />
                      <TextField
                        name='approverCode'
                        value={props.values.approverCode}
                        type='password'
                        required
                        autoComplete='off'
                        onChange={props.handleChange}
                      />
                    </Box>
                  </Box>
                  <Box className="footer">
                    <Box className="errors">
                      <GraphQLError error={mutationQuery.error ?? {}} />
                    </Box>
                    <Box className='buttons'>
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
