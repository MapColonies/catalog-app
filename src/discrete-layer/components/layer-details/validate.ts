/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import moment from 'moment';
import vest, { test, enforce } from 'vest';
import { IEnforceRules } from 'vest/enforce';
import { ValidationTypeName } from '../../../common/models/validation.enum';
import {
  DateGranularityType,
  FieldConfigModelType,
  ValidationConfigModelType,
  ValidationValueType,
} from '../../models';
import { FieldInfoName } from './layer-details.field-info';
import { getBasicType, getValidationType } from './utils';

enforce.extend({
  afterOrSame: (
    val1: moment.Moment,
    val2: moment.Moment,
    validateTime = false
  ) => {
    // startOf method mutates the obj
    const value1 = val1.clone();
    const value2 = val2.clone();

    if (validateTime === false) {
      value1.startOf('day');
      value2.startOf('day');
    }

    return value1.isAfter(value2) || value1.isSame(value2);
  },
  beforeOrSame: (
    val1: moment.Moment,
    val2: moment.Moment,
    validateTime = false
  ) => {
    // startOf method mutates the obj
    const value1 = val1.clone();
    const value2 = val2.clone();

    if (validateTime === false) {
      value1.startOf('day');
      value2.startOf('day');
    }

    return value1.isBefore(value2) || value1.isSame(value2);
  },
  isJson: (val) => {
    try {
      if (typeof val === 'string') {
        JSON.parse(val);
      }
      return true;
    } catch (e) {
      return false;
    }
  },
  extIsNotEmpty: (val) => {
    if (moment.isMoment(val)) {
      return moment(val).isValid();
    }

    const isEmptyVal = typeof val === 'undefined' || val === null || val === '';
    return !isEmptyVal;
  },
});

const suite = (
  fieldDescriptor: FieldConfigModelType[],
  data: Record<string, unknown> = {}
): unknown => {
  const greaterThanOrEquals = (
    basicType: string,
    value1: unknown,
    value2: unknown,
    validateTime = false
  ): IEnforceRules => {
    switch (basicType) {
      case 'momentDateType':
        return enforce(value1).afterOrSame(value2, validateTime);
      case 'resolution':
      case 'number':
        return enforce(value1).greaterThanOrEquals(value2 as number);
      default:
        return enforce(false).isTruthy();
    }
  };

  const lessThanOrEquals = (
    basicType: string,
    value1: unknown,
    value2: unknown,
    validateTime = false
  ): IEnforceRules => {
    switch (basicType) {
      case 'momentDateType':
        return enforce(value1).beforeOrSame(value2, validateTime);
      case 'resolution':
      case 'number':
        return enforce(value1).lessThanOrEquals(value2 as number);
      default:
        return enforce(false).isTruthy();
    }
  };

  const getValueToCompare = (
    validation: ValidationConfigModelType,
    data: Record<string, unknown>
  ): number | undefined => {
    const value = getValidationType(validation) ?? '';
    // @ts-ignore
    const param = validation[value] as string | number;
    if (validation.valueType === ValidationValueType.FIELD) {
      if (data[param] !== undefined) {
        return data[param as string] as number;
      }
    } else {
      return param as number;
    }
  };

  const validate = vest.create((data: Record<string, unknown>): void => {
    fieldDescriptor.forEach((field: FieldConfigModelType): void => {
      let value2Compare;
      const fieldName = field.fieldName as string;
      const basicType = getBasicType(
        fieldName as FieldInfoName,
        data.__typename as string
      );
      const shouldValidateTime =
        field.dateGranularity === DateGranularityType.DATE_AND_TIME;

      field.validation?.forEach(
        (validation: ValidationConfigModelType): void => {
          if (validation) {
            /* eslint-disable */
            test(fieldName, validation.errorMsgTranslation as string, () => {
              if (data[fieldName]) {
                const validationType = getValidationType(validation);
                if (validationType !== undefined) {
                  switch (validationType) {
                    case ValidationTypeName.required:
                      enforce(data[fieldName]).extIsNotEmpty();
                      break;
                    case ValidationTypeName.pattern:
                      enforce(data[fieldName]).matches(
                        validation.pattern as string
                      );
                      break;
                    case ValidationTypeName.min:
                      value2Compare = getValueToCompare(validation, data);
                      if (value2Compare !== undefined) {
                        greaterThanOrEquals(
                          basicType,
                          data[fieldName],
                          value2Compare,
                          shouldValidateTime
                        );
                      }
                      break;
                    case ValidationTypeName.max:
                      value2Compare = getValueToCompare(validation, data);
                      if (value2Compare !== undefined) {
                        lessThanOrEquals(
                          basicType,
                          data[fieldName],
                          value2Compare,
                          shouldValidateTime
                        );
                      }
                      break;
                    case ValidationTypeName.minLength:
                      enforce(data[fieldName]).longerThanOrEquals(
                        validation.minLength as number
                      );
                      break;
                    case ValidationTypeName.maxLength:
                      enforce(data[fieldName]).shorterThanOrEquals(
                        validation.maxLength as number
                      );
                      break;
                    case ValidationTypeName.json:
                      enforce(data[fieldName]).isJson();
                      break;
                  }
                }
              }
            });
            /* eslint-enable */
          }
        }
      );
    });
  });

  validate(data);

  return validate;
};

// eslint-disable-next-line
export default suite;
