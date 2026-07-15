import React, { useRef, useEffect, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import { Feature, Geometry } from 'geojson';
import { Formik, FormikProps } from 'formik';
import { DialogContent } from '@material-ui/core';
import { Button, CircularProgress, TextField } from '@map-colonies/react-core';
import { Dialog, Icon, Typography } from '@map-colonies/react-core';
import {
  Box,
  getWMTSOptions,
  getXYZOptions,
  VectorLayer,
  VectorSource,
} from '@map-colonies/react-components';
import { getFirstPoint } from '../../../../common/utils/geo.tools';
import { Mode } from '../../../../common/models/mode.enum';
import { LinkType } from '../../../../common/models/link-type.enum';
import { getTextStyle } from '../../../../common/helpers/style';
import { FlyTo } from '../../../../common/components/ol-map/fly-to';
import { FieldLabelComponent } from '../../../../common/components/form/field-label';
import { GraphQLError } from '../../../../common/components/error/graphql.error-presentor';
import {
  buildOlTileLayer,
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
import { EntityDeleteDialogProps } from '../3D/entity.3d.delete-dialog';
import { useDeleteLayer } from '../delete.hook';
import { GeoFeaturesPresentorComponent } from './pp-map';
import { FeatureType } from './feature-type.enum';
import { GeometryZIndex } from './pp-map.utils';
import { GeoFeaturesInnerComponent } from './geo-features-inner.component';

import './entity.raster.delete-dialog.css';

export const EntityDeleteRasterDialog: React.FC<EntityDeleteDialogProps> = observer(
  (props: EntityDeleteDialogProps) => {
    const { isOpen, onSetOpen, layerRecord } = props;
    const store = useStore();
    const intl = useIntl();
    const mutationQuery = useQuery();

    const formikRef = useRef<FormikProps<any>>() as any;
    const [initialDeleteValues] = React.useState<any>({ approvalCode: '', approverName: '' });
    const [showPolygonParts, setShowPolygonParts] = React.useState<boolean>(false);

    const { dialogTitleParamTranslation, closeDialog, warningMessage } = useDeleteLayer({
      onSetOpen,
      layerRecord,
      recordType: props.recordType,
    });

    const deleteLayer = (approverName: string, approvalCode: string): void => {
      mutationQuery.setQuery(
        store.mutateDeleteRasterLayer({
          data: {
            id: layerRecord.id,
            type: layerRecord.type as RecordType,
            approverName,
            approvalCode,
          },
        })
      );
    };

    useEffect(() => {
      if (mutationQuery.data && !mutationQuery.error) {
        props.onSetOpen(false);
        props.onSuccess?.();
      }
    }, [mutationQuery.data]);

    const flyToFeature = useMemo(() => {
      return {
        type: 'Feature',
        properties: {},
        geometry: layerRecord.footprint,
      } as Feature;
    }, []);

    const existingPolygonPartsMarker = useMemo((): Feature | undefined => {
      const footprint = layerRecord?.footprint;
      if (!footprint) {
        return undefined;
      }
      return {
        type: 'Feature',
        properties: {
          _featureType: FeatureType.PP_PERIMETER_MARKER,
        },
        geometry: {
          type: 'Point',
          coordinates: getFirstPoint(footprint as Geometry),
        },
      };
    }, [layerRecord?.footprint]);

    const layerImage = useMemo(() => {
      if (!layerRecord) {
        return undefined;
      }
      const layerLink = getLayerLink(layerRecord);
      if (!layerLink?.url) {
        return undefined;
      }
      if (layerLink.protocol === LinkType.XYZ_LAYER) {
        const xyzOptions = getXYZOptions({
          url: getLinkUrlWithToken([layerLink]) as string,
        });
        return buildOlTileLayer({
          key: layerRecord.id,
          kind: 'XYZ',
          options: xyzOptions,
          layerOptions: { zIndex: GeometryZIndex.LAYER_IMAGE },
        });
      }
      if (layerLink.protocol === LinkType.WMTS_LAYER || layerLink.protocol === LinkType.WMTS) {
        const capability = store.discreteLayersStore.capabilities?.find(
          (item) => layerLink.name === item.id
        );
        const resolved = resolveWmtsCapabilityParams(
          layerRecord as LayerRasterRecordModelType,
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

        return buildOlTileLayer({
          key: layerRecord.id,
          kind: 'WMTS',
          options: wmtsOptions,
          layerOptions: { extent: layerRecord.footprint?.bbox, zIndex: GeometryZIndex.LAYER_IMAGE },
        });
      }
      return undefined;
    }, [layerRecord]);

    return (
      <Box id="rasterDeleteDialog">
        <Dialog open={isOpen} preventOutsideDismiss={true}>
          <DialogActionTitle
            domain={dialogTitleParamTranslation}
            action={Mode.DELETE}
            onClose={closeDialog}
            style={getTextStyle(layerRecord as any, 'backgroundColor')}
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
              layerRecord={layerRecord}
              mode={Mode.DELETE}
              style={{ height: 'var(--map-height)', position: 'relative', direction: 'ltr' }}
              defaultShowBaseMap={false}
              onShowPolygonPartsChange={setShowPolygonParts}
            >
              <>
                {layerImage}
                {showPolygonParts && existingPolygonPartsMarker && (
                  <VectorLayer options={{ zIndex: GeometryZIndex.PP_PERIMETER_MARKER }}>
                    <VectorSource>
                      <GeoFeaturesInnerComponent
                        geoFeatures={[existingPolygonPartsMarker]}
                        renderCount={{ current: 1 }}
                      />
                    </VectorSource>
                  </VectorLayer>
                )}
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

                if (!values.approverName?.trim()) {
                  errors.approverName = true;
                }

                if (!values.approvalCode?.trim()) {
                  errors.approvalCode = true;
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
                          id: 'delete.approval-code',
                        })}
                        isRequired={true}
                      />
                      <TextField
                        name="approvalCode"
                        value={props.values.approvalCode}
                        type="password"
                        required
                        autoComplete="new-password"
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
