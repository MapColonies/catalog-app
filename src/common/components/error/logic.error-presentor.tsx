import React from 'react';
import { useIntl } from 'react-intl';
import { isEmpty } from 'lodash';
import { IconButton } from '@map-colonies/react-core';
import { ErrorLevel, IError } from '../../../discrete-layer/components/helpers/errorUtils';
import { AutoDirectionBox } from '../auto-direction-box/auto-direction-box.component';

import './error-presentor.css';


interface ILogicErrorProps {
  errors: IError[];
  iconType: ErrorLevel;
}

export const LogicError: React.FC<ILogicErrorProps> = ({ errors, iconType: iconColor }) => {

  const intl = useIntl();

  return (
    <>
      {
        !isEmpty(errors) &&
        <AutoDirectionBox className="errorContainer">
          <IconButton
            className={`errorIcon mc-icon-Status-Warnings ${iconColor}`}
            onClick={(e): void => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
          <ul className="errorsList">
            {
              errors?.map((error, index) => {
                return (
                  <li dir="auto"
                    style={{'color': error.level === 'error' ? 'var(--mdc-theme-gc-error-high)' : 'var(--mdc-theme-gc-warning-high)'}} 
                    key={index} 
                    dangerouslySetInnerHTML={{__html:  intl.formatMessage({ id: error.code }, { value: error.message })}} 
                  />
                );
              })
            }
          </ul>
        </AutoDirectionBox>
      }
    </>
  );

};
