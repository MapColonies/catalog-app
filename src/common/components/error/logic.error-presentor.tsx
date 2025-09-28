import React from 'react';
import { useIntl } from 'react-intl';
import { isEmpty } from 'lodash';
import { IconButton } from '@map-colonies/react-core';
import { AutoDirectionBox } from '../auto-direction-box/auto-direction-box.component';

import './error-presentor.css';

interface IStateMachineError {
  errors: {
    message: string,
    code: string
  }[];
}


export const LogicError: React.FC<IStateMachineError> = ({ errors }) => {

  const intl = useIntl();

  return (
    <>
      {
        !isEmpty(errors) &&
        <AutoDirectionBox className="errorContainer">
          <IconButton className="errorIcon mc-icon-Status-Warnings" 
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
                    key={index} 
                    dangerouslySetInnerHTML={{__html:  intl.formatMessage({ id: error.code}, {value: error.message })}} 
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
