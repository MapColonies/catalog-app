/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from 'react';
import { useIntl } from 'react-intl';
import { Icon, Tooltip } from '@map-colonies/react-core';
import { emphasizeByHTML } from '../../../../common/helpers/formatters';
import { convertExponentialToDecimal } from '../../../../common/helpers/number';
import {
  ValidationConfigModelType,
  ValidationValueType,
} from '../../../models';
import { IRecordFieldInfo } from '../layer-details.field-info';
import { getInfoMsgValidationType, getValidationType } from '../utils';

const START = 0;
const EMPTY = 0;

interface FormInputInfoTooltipProps {
  fieldInfo: IRecordFieldInfo;
}

export const FormInputInfoTooltipComponent: React.FC<
  FormInputInfoTooltipProps
> = ({ fieldInfo }) => {
  const intl = useIntl();

  const getInfoMsg = (fieldInfo: IRecordFieldInfo, msgCode: string): string => {
    let infoMsgParamValue = '';
    const infoMsgType = getInfoMsgValidationType(msgCode);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (infoMsgType !== undefined) {
      const validation =
        fieldInfo.validation !== undefined
          ? (fieldInfo.validation as ValidationConfigModelType[])
          : undefined;
      validation?.forEach((val: ValidationConfigModelType) => {
        const validationType = getValidationType(val) ?? '';
        if (validationType === infoMsgType && validationType !== 'required') {
          // @ts-ignore
          // eslint-disable-next-line
          const validationParamValue: string = val[validationType] ?? '';
          if (validationParamValue !== '') {
            if (val.valueType === ValidationValueType.FIELD) {
              const fieldLabel = fieldInfo.label as string;
              const fieldLabelPrefix = fieldLabel.substring(
                START,
                fieldLabel.lastIndexOf('.')
              );
              infoMsgParamValue = intl.formatMessage({
                id: `${fieldLabelPrefix}.${validationParamValue}`,
              });
            } else {
              infoMsgParamValue =
                convertExponentialToDecimal(validationParamValue);
            }
            return;
          }
        }
      });
    }
    return intl.formatMessage(
      { id: msgCode },
      { value: emphasizeByHTML(`${infoMsgParamValue}`) }
    );
  };

  return (
    <>
      {fieldInfo.infoMsgCode &&
        (fieldInfo.infoMsgCode as string[]).length > EMPTY && (
          <Tooltip
            content={
              <ul className="textFieldInfoList">
                {(fieldInfo.infoMsgCode as string[]).map(
                  (msg: string, index: number) => {
                    return (
                      <li
                        key={index}
                        dangerouslySetInnerHTML={{
                          __html: getInfoMsg(fieldInfo, msg),
                        }}
                      ></li>
                    );
                  }
                )}
              </ul>
            }
          >
            <Icon
              className="textFieldInfoIcon"
              icon={{ icon: 'info', size: 'xsmall' }}
            />
          </Tooltip>
        )}
    </>
  );
};
