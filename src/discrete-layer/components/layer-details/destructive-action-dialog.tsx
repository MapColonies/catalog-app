import React, { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Formik, FormikProps } from 'formik';
import { DialogContent } from '@material-ui/core';
import { Button, CircularProgress } from '@map-colonies/react-core';
import { Dialog } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { Mode } from '../../../common/models/mode.enum';
import { getTextStyle } from '../../../common/helpers/style';
import { GraphQLError } from '../../../common/components/error/graphql.error-presentor';
import { ValidationsError } from '../../../common/components/error/validations.error-presentor';
import { ILayerImage } from '../../models/layerImage';
import {
  ApprovalFormValues,
  ApproverFields,
  APPROVAL_INITIAL_VALUES,
  buildApprovalFieldsSchema,
} from './approver-fields';
import { DialogActionTitle } from './dialog.helpers';
import { DialogDisclaimer } from './dialog-disclaimer';
import { LayerHeader } from './layer-header';

import './destructive-action-dialog.css';

const NONE = 0;

export interface ActionDialogProps {
  layerRecord: ILayerImage;
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

interface DestructiveActionDialogProps {
  elementId: string;
  action: Mode;
  isOpen: boolean;
  layerRecord: ILayerImage;
  dialogTitleParamTranslation: string;
  disclaimer: string;
  onClose: () => void;
  onSubmit: (approverName: string, approvalCode: string) => void;
  loading: boolean;
  error: unknown;
  polygonPartsError?: Record<string, string[]> | null;
  map: JSX.Element | null;
  sidePanel?: JSX.Element | null;
  onFieldsValidate?: () => void;
}

export const DestructiveActionDialog: React.FC<DestructiveActionDialogProps> = ({
  elementId,
  action,
  isOpen,
  layerRecord,
  dialogTitleParamTranslation,
  disclaimer,
  onClose,
  onSubmit,
  loading,
  error,
  polygonPartsError = null,
  map,
  sidePanel = null,
  onFieldsValidate,
}) => {
  const intl = useIntl();

  const fieldsSchema = useMemo(() => buildApprovalFieldsSchema(intl), [intl]);

  return (
    <Box id={elementId} className="destructiveActionDialog">
      <Dialog open={isOpen} preventOutsideDismiss={true}>
        <DialogActionTitle
          domain={dialogTitleParamTranslation}
          action={action}
          onClose={onClose}
          style={getTextStyle(layerRecord as any, 'backgroundColor')}
        />
        <DialogContent>
          <DialogDisclaimer content={disclaimer} />
          <LayerHeader layerRecord={layerRecord} />
          <Formik
            initialValues={APPROVAL_INITIAL_VALUES}
            validateOnMount
            validationSchema={fieldsSchema}
            validate={() => {
              onFieldsValidate?.();
            }}
            onSubmit={(values) => {
              onSubmit(values.approverName, values.approvalCode);
            }}
          >
            {(formikProps: FormikProps<ApprovalFormValues>) => {
              let fieldErrors: Record<string, string[]> = {};
              Object.entries(formikProps.errors).forEach(([key, value]) => {
                if (formikProps.getFieldMeta(key).touched) {
                  fieldErrors[key] = (Array.isArray(value) ? value : [value]) as string[];
                }
              });
              const mergedErrors = { ...fieldErrors, ...(polygonPartsError ?? {}) };

              return (
                <form onSubmit={formikProps.handleSubmit}>
                  {sidePanel ? (
                    <Box className="mapRow">
                      <Box className="overlayPanel">
                        {sidePanel}
                        <ApproverFields formikProps={formikProps} className="sidePanelFields" />
                      </Box>
                      <Box className="mapColumn">{map}</Box>
                    </Box>
                  ) : (
                    <>
                      {map}
                      <ApproverFields formikProps={formikProps} className="fields" />
                    </>
                  )}
                  <Box className="footer">
                    <Box className="errors">
                      <GraphQLError error={error} />
                      {Object.keys(mergedErrors).length > NONE && (
                        <ValidationsError errors={mergedErrors} />
                      )}
                    </Box>
                    <Box className="buttons">
                      <Button
                        raised
                        type="submit"
                        disabled={!formikProps.isValid || loading || error !== null}
                      >
                        {loading ? (
                          <CircularProgress className="loading" />
                        ) : (
                          <FormattedMessage id="general.ok-btn.text" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        onClick={(): void => {
                          onClose();
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
};
