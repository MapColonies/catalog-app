import React from 'react';
import { IntlShape, useIntl } from 'react-intl';
import * as Yup from 'yup';
import { FormikProps } from 'formik';
import { TextField } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { FieldLabelComponent } from '../../../common/components/form/field-label';
import { FieldConfigModelType } from '../../models';
import { getYupFieldConfig } from './utils';

export interface ApprovalFormValues {
  approverName: string;
  approvalCode: string;
}

export const APPROVAL_INITIAL_VALUES: ApprovalFormValues = {
  approverName: '',
  approvalCode: '',
};

const APPROVER_NAME_LABEL_ID = 'action.approver-name';
const APPROVAL_CODE_LABEL_ID = 'action.approval-code';

export const buildApprovalFieldsSchema = (intl: IntlShape) =>
  Yup.object({
    approverName: getYupFieldConfig(
      { label: APPROVER_NAME_LABEL_ID } as FieldConfigModelType,
      intl
    ),
    approvalCode: getYupFieldConfig(
      { label: APPROVAL_CODE_LABEL_ID } as FieldConfigModelType,
      intl
    ),
  });

interface ApproverFieldsProps {
  formikProps: FormikProps<ApprovalFormValues>;
  className?: string;
}

export const ApproverFields: React.FC<ApproverFieldsProps> = ({ formikProps, className }) => {
  const intl = useIntl();

  return (
    <Box className={className}>
      <Box className="field">
        <FieldLabelComponent
          value={intl.formatMessage({ id: APPROVER_NAME_LABEL_ID })}
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
          value={intl.formatMessage({ id: APPROVAL_CODE_LABEL_ID })}
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
  );
};
