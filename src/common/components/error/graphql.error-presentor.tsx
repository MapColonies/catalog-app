/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/naming-convention */
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { isEmpty } from 'lodash';
import { IconButton } from '@map-colonies/react-core';
import { AutoDirectionBox } from '../auto-direction-box/auto-direction-box.component';
import {
  getErrorMessage,
  IServerError,
  SERVER_ERROR_RESPONSE_CODE,
  USER_ERROR_RESPONSE_CODE,
} from './helpers';

import './error-presentor.css';

export interface IGpaphQLError {
  error: any;
}

export const GraphQLError: React.FC<IGpaphQLError> = ({ error }) => {
  const intl = useIntl();

  return (
    <>
      {!isEmpty(error?.response) && (
        <AutoDirectionBox className="errorContainer">
          <IconButton
            className="errorIcon mc-icon-Status-Warnings error"
            onClick={(e): void => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
          <ul className="errorsList">
            {error.response.errors?.map((error: IServerError, index: number) => {
              return (
                <li
                  dir="auto"
                  key={index}
                  dangerouslySetInnerHTML={{ __html: getErrorMessage(error, intl) }}
                ></li>
              );
            })}
            {error.response.status >= USER_ERROR_RESPONSE_CODE &&
              error.response.status < SERVER_ERROR_RESPONSE_CODE && (
                <li dir="auto" key={error.response.status as number}>
                  <FormattedMessage id={`general.http-${error.response.status}.error`} />
                </li>
              )}
            {error.response.status >= SERVER_ERROR_RESPONSE_CODE && (
              <li dir="auto" key={error.response.status as number}>
                <FormattedMessage id="general.server.error" />
              </li>
            )}
          </ul>
        </AutoDirectionBox>
      )}
      {!isEmpty(error?.message) && (
        <AutoDirectionBox className="errorContainer">
          <IconButton
            className="errorIcon mc-icon-Status-Warnings error"
            onClick={(e): void => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
          <ul className="errorsList">
            <li dir="auto" dangerouslySetInnerHTML={{ __html: getErrorMessage(error, intl) }}></li>
          </ul>
        </AutoDirectionBox>
      )}
    </>
  );
};
