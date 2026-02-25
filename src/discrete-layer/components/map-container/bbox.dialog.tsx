import React, { useCallback, useState } from 'react';
import { FormattedMessage, useIntl, IntlShape } from 'react-intl';
import { useFormik } from 'formik';
import { isEmpty } from 'lodash';
import * as Yup from 'yup';
import * as turf from '@turf/helpers';
import distance from '@turf/distance/dist/js'; //TODO: make a consumption "REGULAR"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  IconButton,
} from '@map-colonies/react-core';
import {
  BboxCorner,
  Box,
  DrawType,
  IDrawingEvent,
} from '@map-colonies/react-components';
import CONFIG from '../../../common/config';
import { ValidationsError } from '../../../common/components/error/validations.error-presentor';
import { FieldLabelComponent } from '../../../common/components/form/field-label';
import { emphasizeByHTML } from '../../../common/helpers/formatters';
import { BBoxCorner, Corner } from '../bbox/bbox-corner-indicator';

import './bbox.dialog.css';

const NONE = 0;

export interface BBoxCorners {
  topRightLat: number;
  topRightLon: number;
  bottomLeftLat: number;
  bottomLeftLon: number;
}

interface BBoxCornersError {
  latDistance?: string;
  lonDistance?: string;
  invalid?: string;
}

const validate = (values: BBoxCorners, intl: IntlShape): BBoxCornersError => {
  const errors: BBoxCornersError = {};

  try {
    turf.lineString([
      [values.bottomLeftLon, values.bottomLeftLat],
      [values.topRightLon, values.topRightLat],
    ]);

    const yDistance = distance(
      [values.bottomLeftLon, values.bottomLeftLat],
      [values.bottomLeftLon, values.topRightLat]
    );

    const xDistance = distance(
      [values.bottomLeftLon, values.bottomLeftLat],
      [values.topRightLon, values.bottomLeftLat]
    );

    if (yDistance > CONFIG.BOUNDARIES.MAX_Y_KM) {
      errors.latDistance = intl.formatMessage({
        id: 'custom-bbox.form-error.y-distance.text',
      });
    }

    if (xDistance > CONFIG.BOUNDARIES.MAX_X_KM) {
      errors.lonDistance = intl.formatMessage({
        id: 'custom-bbox.form-error.x-distance.text',
      });
    }
  } catch (err) {
    errors.invalid = intl.formatMessage({
      id: 'custom-bbox.form-error.invalid.text',
    });
  }

  return errors;
};

interface BBoxDialogProps {
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
  onPolygonUpdate: (polygon: IDrawingEvent) => void;
  corners?: BBoxCorners;
}

export const BBoxDialog: React.FC<BBoxDialogProps> = ({
  isOpen,
  onSetOpen,
  onPolygonUpdate,
  corners: currentCorners,
}) => {
  const intl = useIntl();
  const [corners] = useState<BBoxCorners>(
    currentCorners ?? {
      topRightLat: 0,
      topRightLon: 0,
      bottomLeftLat: 0,
      bottomLeftLon: 0,
    }
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yupSchema: Record<string, any> = {};
  Object.keys(corners).forEach((fieldName) => {
    const fieldLabel = `custom-bbox.dialog-field.${fieldName}.label`;
    yupSchema[fieldName] = Yup.number().required(
      intl.formatMessage(
        { id: 'validation-general.number' },
        {
          fieldName: emphasizeByHTML(
            `${intl.formatMessage({ id: fieldLabel })}`
          ),
        }
      )
    );
  });

  const formik = useFormik({
    initialValues: corners,
    validationSchema: Yup.object({
      ...yupSchema,
    }),
    onSubmit: (values) => {
      const errors = validate(values, intl);
      if (
        errors.latDistance === undefined &&
        errors.lonDistance === undefined &&
        errors.invalid === undefined
      ) {
        try {
          onPolygonUpdate({
            primitive: undefined,
            type: DrawType.BOX,
            geojson: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: {
                    type: BboxCorner.TOP_RIGHT,
                  },
                  geometry: {
                    type: 'Point',
                    coordinates: [values.topRightLon, values.topRightLat],
                  },
                },
                {
                  type: 'Feature',
                  properties: {
                    type: BboxCorner.BOTTOM_LEFT,
                  },
                  geometry: {
                    type: 'Point',
                    coordinates: [values.bottomLeftLon, values.bottomLeftLat],
                  },
                },
              ],
            },
          });
          closeDialog();
          setFormErrors({});
        } catch (e) {
          console.error(e);
        }
      } else {
        setFormErrors(errors);
      }
    },
  });

  const [formErrors, setFormErrors] = useState<BBoxCornersError>({});

  const closeDialog = useCallback(() => {
    onSetOpen(false);
  }, [onSetOpen]);

  const getValidationErrors = (
    errors: Record<string, unknown>
  ): Record<string, string[]> => {
    const validationResults: Record<string, string[]> = {};
    Object.entries(errors).forEach(([key, value]) => {
      validationResults[key] = [value as string];
    });
    return validationResults;
  };

  return (
    <Box id="bboxDialog">
      <Dialog open={isOpen} preventOutsideDismiss={true}>
        <DialogTitle>
          <FormattedMessage id="custom-bbox.dialog.title" />
          <IconButton
            className="closeIcon mc-icon-Close"
            label="CLOSE"
            onClick={(): void => {
              closeDialog();
            }}
          />
        </DialogTitle>
        <DialogContent>
          <form onSubmit={formik.handleSubmit} className="bboxForm" noValidate>
            <Box className="bboxRow">
              <BBoxCorner corner={Corner.TOP_RIGHT} className="bboxField" />
              <Box className="bboxField">
                <FieldLabelComponent
                  value="custom-bbox.dialog-field.topRightLon.label"
                  isRequired={true}
                  showTooltip={false}
                ></FieldLabelComponent>
                <TextField
                  name="topRightLon"
                  type="number"
                  onChange={formik.handleChange}
                  value={formik.values.topRightLon}
                  required={true}
                />
              </Box>
              <Box className="bboxField">
                <FieldLabelComponent
                  value="custom-bbox.dialog-field.topRightLat.label"
                  isRequired={true}
                  showTooltip={false}
                ></FieldLabelComponent>
                <TextField
                  name="topRightLat"
                  type="number"
                  onChange={formik.handleChange}
                  value={formik.values.topRightLat}
                  required={true}
                />
              </Box>
            </Box>
            <Box className="bboxRow">
              <BBoxCorner corner={Corner.BOTTOM_LEFT} className="bboxField" />
              <Box className="bboxField">
                <FieldLabelComponent
                  value="custom-bbox.dialog-field.bottomLeftLon.label"
                  isRequired={true}
                  showTooltip={false}
                ></FieldLabelComponent>
                <TextField
                  name="bottomLeftLon"
                  type="number"
                  onChange={formik.handleChange}
                  value={formik.values.bottomLeftLon}
                  required={true}
                />
              </Box>
              <Box className="bboxField">
                <FieldLabelComponent
                  value="custom-bbox.dialog-field.bottomLeftLat.label"
                  isRequired={true}
                  showTooltip={false}
                ></FieldLabelComponent>
                <TextField
                  name="bottomLeftLat"
                  type="number"
                  onChange={formik.handleChange}
                  value={formik.values.bottomLeftLat}
                  required={true}
                />
              </Box>
            </Box>
            <Box className="footer">
              <Box className="messages">
                {!isEmpty(formik.errors) && (
                  <ValidationsError
                    errors={getValidationErrors(formik.errors)}
                  />
                )}
                {isEmpty(formik.errors) && !isEmpty(formErrors) && (
                  <ValidationsError
                    errors={getValidationErrors(
                      formErrors as Record<string, unknown>
                    )}
                  />
                )}
              </Box>
              <Box className="buttons">
                <Button
                  raised
                  type="submit"
                  disabled={Object.keys(formik.errors).length > NONE}
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
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
};
