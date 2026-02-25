/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/naming-convention */
import React from 'react';
import { IconButton } from '@map-colonies/react-core';
import { AutoDirectionBox } from '../auto-direction-box/auto-direction-box.component';

import './error-presentor.css';

const NONE = 0;

interface IValidationsError {
  errors: Record<string, string[]>;
}

export const ValidationsError: React.FC<IValidationsError> = ({ errors }) => {
  return (
    <>
      {Object.keys(errors).length > NONE && (
        <AutoDirectionBox className="errorContainer">
          <IconButton
            className="errorIcon mc-icon-Status-Warnings"
            onClick={(e): void => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
          <ul className="errorsList">
            {Object.keys(errors).map((key: string) => {
              return errors[key].map((errorMessage: string, index: number) => {
                return (
                  <li
                    dir="auto"
                    key={`${key}${index}`}
                    dangerouslySetInnerHTML={{ __html: errorMessage }}
                  ></li>
                );
              });
            })}
          </ul>
        </AutoDirectionBox>
      )}
    </>
  );
};
