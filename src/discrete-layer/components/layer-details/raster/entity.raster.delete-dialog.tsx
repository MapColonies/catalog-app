import React, { useRef, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import { Feature } from 'geojson';
import * as Yup from 'yup';
import { Formik, FormikProps } from 'formik';
import { DialogContent } from '@material-ui/core';
import { Button, CircularProgress, TextField } from '@map-colonies/react-core';
import { Dialog, Icon, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { Mode } from '../../../../common/models/mode.enum';
import { getTextStyle } from '../../../../common/helpers/style';
import { FlyTo } from '../../../../common/components/ol-map/fly-to';
import { FieldLabelComponent } from '../../../../common/components/form/field-label';
import { GraphQLError } from '../../../../common/components/error/graphql.error-presentor';
import { ValidationsError } from '../../../../common/components/error/validations.error-presentor';
import { OlLayerRecordTile } from '../../map-container/ol.layer-record.tile';
import {
  EntityDescriptorModelType,
  FieldConfigModelType,
  RecordType,
  RootStoreType,
  useQuery,
  useStore,
} from '../../../models';
import { getYupFieldConfig } from '../utils';
import { DialogActionTitle } from '../dialog.helpers';
import { LayersDetailsComponent } from '../layer-details';
import { EntityDeleteDialogProps } from '../entity.delete';
import { useDeleteLayer } from '../delete.hook';
import { START_RASTER_LAYER_ZINDEX } from './pp-map.utils';
import { GeoFeaturesPresentorComponent } from './pp-map';

import './entity.raster.delete-dialog.css';

const NONE = 0;

type DeleteRasterLayerResult = Awaited<ReturnType<RootStoreType['mutateDeleteRasterLayer']>>; // see (MAPCO-11216)

export const EntityDeleteRasterDialog: React.FC<EntityDeleteDialogProps> = observer(
  (props: EntityDeleteDialogProps) => {
    const store = useStore();
    const intl = useIntl();
    const mutationQuery = useQuery<DeleteRasterLayerResult>();

    const formikRef = useRef<FormikProps<any>>() as any;
    const [initialDeleteValues] = useState<any>({ approvalCode: '', approverName: '' });
    const [mutationError, setMutationError] = useState<any>(null);
    const [polygonPartsError, setPolygonPartsError] = useState<Record<string, string[]> | null>(
      null
    );

    const deleteFieldsSchema = Yup.object({
      approverName: getYupFieldConfig(
        { label: 'delete.approver-name' } as FieldConfigModelType,
        intl
      ),
      approvalCode: getYupFieldConfig(
        { label: 'delete.approval-code' } as FieldConfigModelType,
        intl
      ),
    });

    const { dialogTitleParamTranslation, closeDialog, warningMessage } = useDeleteLayer({
      onSetOpen: props.onSetOpen,
      layerRecord: props.layerRecord,
      recordType: RecordType.RECORD_RASTER,
    });

    useEffect(() => {
      if (store.discreteLayersStore.customValidationError) {
        setPolygonPartsError(store.discreteLayersStore.customValidationError);
        setMutationError(null);
      } else {
        setPolygonPartsError(null);
      }
    }, [store.discreteLayersStore.customValidationError]);

    useEffect(() => {
      return () => {
        store.discreteLayersStore.clearCustomValidationError();
      };
    }, []);

    useEffect(() => {
      if (mutationQuery.data && !mutationQuery.error) {
        props.onSuccess?.();
        props.onSetOpen(false);
      }
      if (mutationQuery.error) {
        setMutationError(mutationQuery.error);
        setPolygonPartsError(null);
      }
    }, [mutationQuery.data, mutationQuery.error]);

    const deleteLayer = (approverName: string, approvalCode: string): void => {
      mutationQuery.setQuery(
        store.mutateDeleteRasterLayer({
          data: {
            id: props.layerRecord.id,
            type: props.layerRecord.type as RecordType,
            approverName,
            approvalCode,
          },
        })
      );
    };

    const flyToFeature = useMemo(() => {
      return {
        type: 'Feature',
        properties: {},
        geometry: props.layerRecord.footprint,
      } as Feature;
    }, []);

    const layerCapability = store.discreteLayersStore.getLayerCapability(props.layerRecord);
    const layerOptions = useMemo(() => {
      return {
        extent: props.layerRecord.footprint?.bbox,
        zIndex: START_RASTER_LAYER_ZINDEX,
      };
    }, [props.layerRecord.footprint?.bbox]);

    return (
      <Box id="rasterDeleteDialog">
        <Dialog open={props.isOpen} preventOutsideDismiss={true}>
          <DialogActionTitle
            domain={dialogTitleParamTranslation}
            action={Mode.DELETE}
            onClose={closeDialog}
            style={getTextStyle(props.layerRecord as any, 'backgroundColor')}
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
            <GeoFeaturesPresentorComponent
              layerRecord={props.layerRecord}
              mode={Mode.DELETE}
              style={{ height: 'var(--map-height)', position: 'relative', direction: 'ltr' }}
              defaultShowBaseMap={false}
              toggleBaseMap={true}
            >
              <>
                <OlLayerRecordTile
                  layerRecord={props.layerRecord}
                  capability={layerCapability}
                  layerOptions={layerOptions}
                />
                <FlyTo feature={flyToFeature} flyOnce={true}></FlyTo>
              </>
            </GeoFeaturesPresentorComponent>
            <Formik
              initialValues={initialDeleteValues}
              enableReinitialize={true}
              innerRef={(instance) => {
                if (instance) {
                  formikRef.current = instance;
                }
              }}
              validateOnMount
              validationSchema={deleteFieldsSchema}
              validate={() => {
                setMutationError(null);
                setPolygonPartsError(null);
              }}
              onSubmit={(values) => {
                deleteLayer(values.approverName, values.approvalCode);
              }}
            >
              {(formikProps) => {
                let fieldErrors: Record<string, string[]> = {};
                Object.entries(formikProps.errors).forEach(([key, value]) => {
                  if (formikProps.getFieldMeta(key).touched) {
                    fieldErrors[key] = (Array.isArray(value) ? value : [value]) as string[];
                  }
                });
                return (
                  <form onSubmit={formikProps.handleSubmit}>
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
                          value={formikProps.values.approverName}
                          type="text"
                          required
                          autoComplete="off"
                          onChange={formikProps.handleChange}
                          onBlur={formikProps.handleBlur}
                        />
                      </Box>
                      <Box className="field">
                        <FieldLabelComponent
                          value={intl.formatMessage({
                            id: 'delete.approval-code',
                          })}
                          isRequired={true}
                        />
                        <TextField
                          name="approvalCode"
                          value={formikProps.values.approvalCode}
                          type="password"
                          required
                          autoComplete="new-password"
                          onChange={formikProps.handleChange}
                          onBlur={formikProps.handleBlur}
                        />
                      </Box>
                    </Box>
                    <Box className="footer">
                      <Box className="errors">
                        <GraphQLError error={mutationError} />
                        {Object.keys({ ...fieldErrors, ...(polygonPartsError ?? {}) }).length >
                          NONE && (
                          <ValidationsError
                            errors={{ ...fieldErrors, ...(polygonPartsError ?? {}) }}
                          />
                        )}
                      </Box>
                      <Box className="buttons">
                        <Button
                          raised
                          type="submit"
                          disabled={
                            !formikProps.isValid || mutationQuery.loading || mutationError !== null
                          }
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
                );
              }}
            </Formik>
          </DialogContent>
        </Dialog>
      </Box>
    );
  }
);
