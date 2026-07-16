import React, { useRef, useEffect, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import { Feature } from 'geojson';
import { Formik, FormikProps } from 'formik';
import { DialogContent } from '@material-ui/core';
import { Button, CircularProgress, TextField } from '@map-colonies/react-core';
import { Dialog, Icon, Typography } from '@map-colonies/react-core';
import { Box, getWMTSOptions, getXYZOptions } from '@map-colonies/react-components';
import { Mode } from '../../../../common/models/mode.enum';
import { LinkType } from '../../../../common/models/link-type.enum';
import { getTextStyle } from '../../../../common/helpers/style';
import { FlyTo } from '../../../../common/components/ol-map/fly-to';
import { FieldLabelComponent } from '../../../../common/components/form/field-label';
import { GraphQLError } from '../../../../common/components/error/graphql.error-presentor';
import { ValidationsError } from '../../../../common/components/error/validations.error-presentor';
import {
  OlTileLayer,
  DEFAULT_PROJECTION,
} from '../../../../common/components/ol-map/ol-tile-layer.utils';
import {
  EntityDescriptorModelType,
  LayerRasterRecordModelType,
  LinkModelType,
  RecordType,
  useQuery,
  useStore,
} from '../../../models';
import {
  getLayerLink,
  getLinkUrlWithToken,
  resolveWmtsCapabilityParams,
} from '../../helpers/layersUtils';
import { DialogActionTitle } from '../dialog.helpers';
import { LayersDetailsComponent } from '../layer-details';
import { EntityDeleteDialogProps } from '../entity.delete';
import { useDeleteLayer } from '../delete.hook';
import { GeoFeaturesPresentorComponent } from './pp-map';
import { START_RASTER_LAYER_ZINDEX } from './pp-map.utils';

import './entity.raster.delete-dialog.css';

const NONE = 0;

export const EntityDeleteRasterDialog: React.FC<EntityDeleteDialogProps> = observer(
  (props: EntityDeleteDialogProps) => {
    const store = useStore();
    const intl = useIntl();
    const mutationQuery = useQuery();

    const formikRef = useRef<FormikProps<any>>() as any;
    const [initialDeleteValues] = React.useState<any>({ approvalCode: '', approverName: '' });
    const [mutationError, setMutationError] = React.useState<any>({});

    const { dialogTitleParamTranslation, closeDialog, warningMessage } = useDeleteLayer({
      onSetOpen: props.onSetOpen,
      layerRecord: props.layerRecord,
      recordType: RecordType.RECORD_RASTER,
    });

    useEffect(() => {
      if (mutationQuery.data && !mutationQuery.error) {
        props.onSetOpen(false);
        props.onSuccess?.();
      }
      if (mutationQuery.error) {
        setMutationError(mutationQuery.error);
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

    const layerImage = useMemo(() => {
      if (!props.layerRecord) {
        return undefined;
      }
      const layerLink = getLayerLink(props.layerRecord);
      if (!layerLink?.url) {
        return undefined;
      }
      if (layerLink.protocol === LinkType.XYZ_LAYER) {
        const xyzOptions = getXYZOptions({
          url: getLinkUrlWithToken([layerLink]) as string,
        });
        return (
          <OlTileLayer
            key={props.layerRecord.id}
            protocol={LinkType.XYZ_LAYER}
            options={xyzOptions}
            layerOptions={{ zIndex: START_RASTER_LAYER_ZINDEX }}
          />
        );
      }
      if (layerLink.protocol === LinkType.WMTS_LAYER || layerLink.protocol === LinkType.WMTS) {
        const capability = store.discreteLayersStore.capabilities?.find(
          (item) => layerLink.name === item.id
        );
        const resolved = resolveWmtsCapabilityParams(
          props.layerRecord as LayerRasterRecordModelType,
          layerLink.url as string,
          capability
        );
        const wmtsOptions = getWMTSOptions({
          url: getLinkUrlWithToken([
            { ...layerLink, url: resolved.url } as LinkModelType,
          ]) as string,
          layer: resolved.layer,
          matrixSet: resolved.tileMatrixSetID,
          format: resolved.format,
          projection: DEFAULT_PROJECTION,
          style: resolved.style,
        });

        return (
          <OlTileLayer
            key={props.layerRecord.id}
            protocol={LinkType.WMTS_LAYER}
            options={wmtsOptions}
            layerOptions={{
              extent: props.layerRecord.footprint?.bbox,
              zIndex: START_RASTER_LAYER_ZINDEX,
            }}
          />
        );
      }
      return undefined;
    }, [props.layerRecord]);

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
                {layerImage}
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
              validate={(values) => {
                const errors: any = {};
                setMutationError({});

                if (!values.approverName?.trim()) {
                  errors.approverName = intl.formatMessage(
                    { id: 'validation-general.required' },
                    { fieldName: intl.formatMessage({ id: 'delete.approver-name' }) }
                  );
                }

                if (!values.approvalCode?.trim()) {
                  errors.approvalCode = intl.formatMessage(
                    { id: 'validation-general.required' },
                    { fieldName: intl.formatMessage({ id: 'delete.approval-code' }) }
                  );
                }

                return errors;
              }}
              onSubmit={(values, actions) => {
                if (formikRef.current?.isValid) {
                  deleteLayer(
                    formikRef.current?.values.approverName,
                    formikRef.current?.values.approvalCode
                  );
                }
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
                        {Object.keys(fieldErrors).length > NONE && (
                          <ValidationsError errors={fieldErrors} />
                        )}
                      </Box>
                      <Box className="buttons">
                        <Button
                          raised
                          type="submit"
                          disabled={!formikProps.isValid || mutationQuery.loading}
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
