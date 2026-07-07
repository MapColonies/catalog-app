import React, { useCallback, useMemo, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useFormik } from 'formik';
import { observer } from 'mobx-react';
import * as Yup from 'yup';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { GraphQLError } from '../../../common/components/error/graphql.error-presentor';
import { FieldLabelComponent } from '../../../common/components/form/field-label';
import { emphasizeByHTML } from '../../../common/helpers/formatters';
import { Mode } from '../../../common/models/mode.enum';
import { ILayerImage } from '../../models/layerImage';
import {
  EntityDescriptorModelType,
  LayerRasterRecordModelType,
  RecordType,
  useQuery,
  useStore,
} from '../../models';
import { LayersDetailsComponent } from './layer-details';
import { GeoFeaturesPresentorComponent } from './raster/pp-map';

import './raster-delete-dialog.css';

interface RasterDeleteDialogProps {
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
  layerRecord: ILayerImage;
}

interface RasterDeleteFormValues {
  approverName: string;
  deletionCode: string;
}

const VALID = 'ok';

export const RasterDeleteDialog: React.FC<RasterDeleteDialogProps> = observer(
  (props: RasterDeleteDialogProps) => {
    const { isOpen, onSetOpen } = props;
    const layerRecord = props.layerRecord as LayerRasterRecordModelType;
    const store = useStore();
    const mutationQuery = useQuery();
    const intl = useIntl();

    const closeDialog = useCallback(() => {
      onSetOpen(false);
    }, [onSetOpen]);

    const deleteMessage = useMemo((): string => {
      return intl.formatMessage(
        { id: 'raster-delete.dialog.message' },
        { action: emphasizeByHTML(`${intl.formatMessage({ id: 'delete.dialog.action' })}`) }
      );
    }, []);

    const refreshCatalog = async (): Promise<void> => {
      const catalogFilter = (recordType: RecordType) => [{ field: 'mc:type', eq: recordType }];
      const catalog = await store.discreteLayersStore.fetchAllCatalog(catalogFilter);
      store.discreteLayersStore.setLayersImages(catalog, false);
    };

    useEffect(() => {
      if (
        !mutationQuery.loading &&
        (mutationQuery.data as { deleteRasterLayer: string } | undefined)?.deleteRasterLayer ===
          VALID
      ) {
        onSetOpen(false);
        void refreshCatalog();
      }
    }, [mutationQuery.data]);

    const formik = useFormik<RasterDeleteFormValues>({
      initialValues: { approverName: '', deletionCode: '' },
      validationSchema: Yup.object({
        approverName: Yup.string().required(),
        deletionCode: Yup.string().required(),
      }),
      onSubmit: (values) => {
        mutationQuery.setQuery(
          store.mutateDeleteRasterLayer({
            data: {
              id: layerRecord.id,
              approverName: values.approverName,
              deletionCode: values.deletionCode,
            },
          })
        );
      },
    });

    return (
      <Box id="rasterDeleteDialog">
        <Dialog open={isOpen} preventOutsideDismiss={true}>
          <DialogTitle>
            <FormattedMessage id="raster-delete.dialog.title" />
            <IconButton className="closeIcon mc-icon-Close" label="CLOSE" onClick={closeDialog} />
          </DialogTitle>
          <DialogContent className="dialogBody">
            <form onSubmit={formik.handleSubmit} noValidate>
              <Box className="headerWarning">
                <Tooltip content={intl.formatMessage({ id: 'general.warning.text' })}>
                  <Icon className="icon" icon={{ icon: 'info', size: 'xsmall' }} />
                </Tooltip>
                <Typography tag="div" dangerouslySetInnerHTML={{ __html: deleteMessage }} />
              </Box>
              <Box id="rasterDeleteDetailsContainer">
                <Box id="rasterDeleteDetails">
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
              <Box className="rasterDeleteMap">
                <GeoFeaturesPresentorComponent
                  mode={Mode.VIEW}
                  layerRecord={layerRecord}
                  showPolygonParts={true}
                  fitOptions={{ padding: [80, 160, 80, 160] }}
                  style={{ width: '100%', height: '100%' }}
                />
              </Box>
              <Box className="categoryFieldsContainer">
                <Box className="categoryField">
                  <FieldLabelComponent
                    value="raster-delete.dialog.approverName-field.label"
                    isRequired={true}
                    showTooltip={false}
                  />
                  <Box className="rasterDeleteFieldValue">
                    <TextField
                      name="approverName"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.approverName}
                      required={true}
                    />
                  </Box>
                </Box>
                <Box className="categoryField">
                  <FieldLabelComponent
                    value="raster-delete.dialog.deletionCode-field.label"
                    isRequired={true}
                    showTooltip={false}
                  />
                  <Box className="rasterDeleteFieldValue">
                    <TextField
                      name="deletionCode"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.deletionCode}
                      required={true}
                    />
                  </Box>
                </Box>
              </Box>
              <Box className="footer">
                <Box className="errors">
                  <GraphQLError error={mutationQuery.error ?? {}} />
                </Box>
                <DialogActions className="buttons">
                  <Button
                    raised
                    type="submit"
                    disabled={!(formik.dirty && formik.isValid) || mutationQuery.loading}
                  >
                    {mutationQuery.loading ? (
                      <CircularProgress className="loading" />
                    ) : (
                      <FormattedMessage id="general.ok-btn.text" />
                    )}
                  </Button>
                  <Button type="button" onClick={closeDialog}>
                    <FormattedMessage id="general.cancel-btn.text" />
                  </Button>
                </DialogActions>
              </Box>
            </form>
          </DialogContent>
        </Dialog>
      </Box>
    );
  }
);
