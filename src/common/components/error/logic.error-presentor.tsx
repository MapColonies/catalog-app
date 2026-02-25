import React from 'react';
import { useIntl } from 'react-intl';
import { isEmpty } from 'lodash';
import { IconButton } from '@map-colonies/react-core';
import { IError } from '../../../discrete-layer/components/helpers/errorUtils';
import { AutoDirectionBox } from '../auto-direction-box/auto-direction-box.component';

import './error-presentor.css';

interface ILogicErrorProps {
  errors: IError[];
}

export const LogicError: React.FC<ILogicErrorProps> = ({ errors }) => {
  const intl = useIntl();

  const iconButtonErrorLevel = React.useMemo(() => {
    return errors.some((error) => error.level === 'error')
      ? 'error'
      : 'warning';
  }, [errors]);

  return (
    <>
      {!isEmpty(errors) && (
        <AutoDirectionBox className="errorContainer">
          <IconButton
            className={`errorIcon mc-icon-Status-Warnings ${iconButtonErrorLevel}`}
            onClick={(e): void => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
          <ul className="errorsList">
            {errors.map((error, index) => (
              <li
                key={index}
                dir="auto"
                className={error.level}
                dangerouslySetInnerHTML={{
                  __html: intl.formatMessage(
                    { id: error.code },
                    { value: error.message }
                  ),
                }}
              />
            ))}
          </ul>
        </AutoDirectionBox>
      )}
    </>
  );
};
