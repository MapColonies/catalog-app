import React, { useMemo } from 'react';
import { observer } from 'mobx-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Formik, FormikProps } from 'formik';
import { DialogContent } from '@material-ui/core';
import { Button, CircularProgress } from '@map-colonies/react-core';
import { Dialog } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { Mode } from '../../../common/models/mode.enum';
import { getTextStyle } from '../../../common/helpers/style';
import { ErrorPresentor } from '../error/error-presentor';
import { ErrorType, getErrorsItems } from '../helpers/errorUtils';
import { UserAction } from '../../models/userStore';
import { EntityDescriptorModelType, RecordType, useStore } from '../../models';
import { ILayerImage } from '../../models/layerImage';
import {
  ApprovalFormValues,
  ApproverFields,
  APPROVAL_INITIAL_VALUES,
  buildApprovalFieldsSchema,
} from './approver-fields';
import { DialogActionTitle } from './dialog-action-title';
import { DialogDisclaimer } from './dialog-disclaimer';
import { LayerHeader } from './layer-header';

import './destructive-action-dialog.css';

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
  recordType: RecordType;
  disclaimerActionId: string;
  onClose: () => void;
  onSubmit: (approverName: string, approvalCode: string) => void;
  loading: boolean;
  map: JSX.Element | null;
  error?: ErrorType[];
  sidePanel?: JSX.Element | null;
  onFieldsValidate?: () => void;
  openRelatedJob?: {
    jobId: string;
  };
}

export const DestructiveActionDialog: React.FC<DestructiveActionDialogProps> = observer(
  ({
    elementId,
    action,
    isOpen,
    layerRecord,
    recordType,
    disclaimerActionId,
    onClose,
    onSubmit,
    loading,
    error,
    map,
    sidePanel = null,
    onFieldsValidate,
    openRelatedJob,
  }) => {
    const intl = useIntl();
    const store = useStore();

    const fieldsSchema = useMemo(() => buildApprovalFieldsSchema(intl), [intl]);

    return (
      <Box id={elementId} className="destructiveActionDialog">
        <Dialog open={isOpen} preventOutsideDismiss={true}>
          <DialogActionTitle
            recordType={recordType}
            action={action}
            onClose={onClose}
            style={getTextStyle(layerRecord as any, 'backgroundColor')}
          />
          <DialogContent>
            <DialogDisclaimer actionId={disclaimerActionId} />
            <LayerHeader
              entityDescriptors={
                store.discreteLayersStore.entityDescriptors as EntityDescriptorModelType[]
              }
              layerRecord={layerRecord}
            />
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
                const fieldErrors: Record<string, string[]> = {};
                Object.entries(formikProps.errors).forEach(([key, value]) => {
                  if (formikProps.getFieldMeta(key).touched) {
                    fieldErrors[key] = (Array.isArray(value) ? value : [value]) as string[];
                  }
                });

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
                        <ErrorPresentor
                          errors={[...(error ?? []), ...getErrorsItems(fieldErrors)]}
                        />
                      </Box>
                      <Box className="buttons">
                        {openRelatedJob && (
                          <Button
                            raised
                            type="button"
                            className="blink-for-attention"
                            onClick={(e): void => {
                              e.preventDefault();
                              e.stopPropagation();
                              store.actionDispatcherStore.dispatchAction({
                                action: UserAction.SYSTEM_CALLBACK_OPEN_JOB_MANAGER,
                                data: { job: { id: openRelatedJob.jobId } },
                              });
                              onClose();
                            }}
                          >
                            <FormattedMessage id="general.go-to-job-manager-btn.text" />
                          </Button>
                        )}
                        <Button
                          raised
                          type="submit"
                          disabled={!formikProps.isValid || loading || !!error}
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
  }
);
