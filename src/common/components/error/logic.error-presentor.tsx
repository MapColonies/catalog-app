import React from 'react';
import { useIntl } from 'react-intl';
import { isEmpty } from 'lodash';
import { IconButton } from '@map-colonies/react-core';
import { AutoDirectionBox } from '../auto-direction-box/auto-direction-box.component';

import './error-presentor.css';
import { IError } from '../../../discrete-layer/components/helpers/errorUtils';


interface ILogicErrorProps {
  errors: IError[];
  iconColor: string;
}

export const LogicError: React.FC<ILogicErrorProps> = ({ errors, iconColor }) => {

  const intl = useIntl();

  return (
    <>
      {
        !isEmpty(errors) &&
        <AutoDirectionBox className="errorContainer">
          <IconButton
            style={{'color': iconColor }}
            className="errorIcon mc-icon-Status-Warnings" 
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
