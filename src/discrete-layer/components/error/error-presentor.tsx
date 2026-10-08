import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';
import { observer } from 'mobx-react';
import { useIntl } from 'react-intl';
import { IconButton } from '@map-colonies/react-core';
import { AutoDirectionBox } from '../../../common/components/auto-direction-box/auto-direction-box.component';
import { useStore } from '../../models';
import { IError } from '../helpers/errorUtils';

import './error-presentor.css';

const NONE = 0;

export interface IErrorPresentor {
  errors?: IError[];
  onErrorsChange?: (hasErrors: boolean) => void;
}

export interface IErrorPresentorRef {
  hasErrors: boolean;
}

export const ErrorPresentor = observer(
  forwardRef<IErrorPresentorRef, IErrorPresentor>(({ errors, onErrorsChange }, ref) => {
    const intl = useIntl();
    const store = useStore();
    const { serviceErrors, customValidationError } = store.discreteLayersStore;

    const allErrors: IError[] = useMemo(() => {
      const flattenedServiceErrors: IError[] = [];
      serviceErrors?.forEach((errorItems) => {
        flattenedServiceErrors.push(...errorItems);
      });
      const combinedErrors = [
        ...(errors ?? []).filter((error) => Boolean(error)),
        ...flattenedServiceErrors,
        ...(customValidationError ? [customValidationError] : []),
      ];
      return combinedErrors;
    }, [errors, serviceErrors, customValidationError]);

    const hasErrors = allErrors.length > NONE;

    const iconButtonErrorLevel = useMemo(() => {
      return allErrors.some((error) => error.level === 'error') ? 'error' : 'warning';
    }, [allErrors]);

    useImperativeHandle(ref, () => ({ hasErrors }), [hasErrors]);

    useEffect(() => {
      onErrorsChange?.(hasErrors);
    }, [hasErrors, onErrorsChange]);

    if (!hasErrors) {
      return null;
    }

    return (
      <AutoDirectionBox className="errorContainer">
        <IconButton
          className={`errorIcon mc-icon-Status-Warnings ${iconButtonErrorLevel}`}
          onClick={(e): void => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
        <ul className="errorsList">
          {allErrors.map((error, index) => (
            <li
              key={index}
              dir="auto"
              className={error.level}
              dangerouslySetInnerHTML={{
                __html: error.code
                  ? intl.formatMessage({ id: error.code }, { value: error.errText })
                  : error.errText ?? '',
              }}
            ></li>
          ))}
        </ul>
      </AutoDirectionBox>
    );
  })
);

ErrorPresentor.displayName = 'ErrorPresentor';
