import React, { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useFormik } from 'formik';
import { isEmpty } from 'lodash';
import * as Yup from 'yup';
import { Button, Dialog, DialogContent, DialogTitle, IconButton, TextField } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { ValidationsError } from '../../../common/components/error/validations.error-presentor';
import { FieldLabelComponent } from '../../../common/components/form/field-label';
import { emphasizeByHTML } from '../../../common/helpers/formatters';

import './poi.dialog.css';

const NONE = 0;

export interface IPOI {
  lon: number;
  lat: number;
}

interface PoiDialogProps {
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
  onPoiUpdate: (longitude: number, latitude: number) => void;
  poi?: IPOI;
}

export const PoiDialog: React.FC<PoiDialogProps> = (
  {
    isOpen,
    onSetOpen,
    onPoiUpdate,
    poi: currentPoi
  }
) => {
  const intl = useIntl();
  
  const closeDialog = useCallback(
    () => {
      onSetOpen(false);
    },
    [onSetOpen]
  );

  const [poi] = useState<IPOI>(currentPoi ?? { lon: 0, lat: 0 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yupSchema: Record<string, any> = {};
  Object.keys(poi).forEach(fieldName => {
    const fieldLabel = `poi.dialog.${fieldName}-field.label`;
    yupSchema[fieldName] = Yup
    .number()
    .required(
      intl.formatMessage(
        { id: 'validation-general.number' },
        { fieldName: emphasizeByHTML(`${intl.formatMessage({ id: fieldLabel })}`) }
      )
    );
  });

  const formik = useFormik({
    initialValues: poi,
    validationSchema: Yup.object({
      ...yupSchema
    }),
    onSubmit: (values) => {
      try {
        onPoiUpdate(values.lon, values.lat);
        closeDialog();
      } catch(e) {
        console.error(e);
      }
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getValidationErrors = (errors: Record<string, any>): Record<string, string[]> => {
    const validationResults: Record<string, string[]> = {};
    Object.entries(errors).forEach(([key, value]) => {
      validationResults[key] = [ value as string ];
    });
    return validationResults;
  };

  return (
    <Box id="poiDialog">
      <Dialog open={isOpen} preventOutsideDismiss={true}>
        <DialogTitle>
          <FormattedMessage id="poi.dialog.title"/>
          <IconButton
            className="closeIcon mc-icon-Close"
            label="CLOSE"
            onClick={ (): void => { closeDialog(); } }
          />
        </DialogTitle>
        <DialogContent>
          <form onSubmit={formik.handleSubmit} className="poiForm" noValidate>
            <Box className="poiRow">
              <Box className="poiField">
                <FieldLabelComponent value='poi.dialog.lon-field.label' isRequired={true} showTooltip={false}></FieldLabelComponent>
                <TextField
                  name="lon"
                  type="number"
                  onChange={formik.handleChange}
                  value={formik.values.lon}
                  required={true}
                />
              </Box>
              <Box className="poiField">
                <FieldLabelComponent value='poi.dialog.lat-field.label' isRequired={true} showTooltip={false}></FieldLabelComponent>
                <TextField
                  name="lat"
                  type="number"
                  onChange={formik.handleChange}
                  value={formik.values.lat}
                  required={true}
                />
              </Box>
            </Box>
            <Box className="footer">
              <Box className="messages">
                {
                  !isEmpty(formik.errors) &&
                  <ValidationsError errors={getValidationErrors(formik.errors)}/>
                }
              </Box>
              <Box className="buttons">
                <Button raised type="submit" disabled={Object.keys(formik.errors).length > NONE}>
                  <FormattedMessage id="general.ok-btn.text"/>
                </Button>
                <Button type="button" onClick={ (): void => { closeDialog(); } }>
                  <FormattedMessage id="general.cancel-btn.text"/>
                </Button>
              </Box>
            </Box>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
};
