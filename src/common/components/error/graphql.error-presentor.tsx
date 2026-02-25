/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/naming-convention */
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { isEmpty } from 'lodash';
import { IconButton } from '@map-colonies/react-core';
import { AutoDirectionBox } from '../auto-direction-box/auto-direction-box.component';

import './error-presentor.css';

const NONE = 0;
const USER_ERROR_RESPONSE_CODE = 400;
const SERVER_ERROR_RESPONSE_CODE = 500;

export interface IGpaphQLError {
  error: any;
}

export interface IServerError {
  message: string;
  serverResponse?: IServerErrorResponse;
}

interface IServerErrorResponse {
  data: { message: string };
  status?: number;
  statusText?: string;
}

export const GraphQLError: React.FC<IGpaphQLError> = ({ error }) => {
  const intl = useIntl();

  const formatMessage = (serverError: IServerError): string => {
    const status = serverError.serverResponse?.status ?? NONE;
    const message = serverError.serverResponse?.data.message
      ? serverError.serverResponse.data.message
      : serverError.serverResponse?.statusText ?? '';
    if (
      status &&
      status >= USER_ERROR_RESPONSE_CODE &&
      status < SERVER_ERROR_RESPONSE_CODE
    ) {
      const translatedError = intl.formatMessage({
        id: `general.http-${status}.error`,
      });
      return `${translatedError}<br/>${message}`;
    } else if (message) {
      return message;
    } else {
      return serverError.message.substring(
        +serverError.message.indexOf('; ') + 1
      );
    }
  };

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
            {error.response.errors?.map(
              (error: IServerError, index: number) => {
                return (
                  <li
                    dir="auto"
                    key={index}
                    dangerouslySetInnerHTML={{ __html: formatMessage(error) }}
                  ></li>
                );
              }
            )}
            {error.response.status >= USER_ERROR_RESPONSE_CODE &&
              error.response.status < SERVER_ERROR_RESPONSE_CODE && (
                <li dir="auto" key={error.response.status as number}>
                  <FormattedMessage
                    id={`general.http-${error.response.status}.error`}
                  />
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
    </>
  );
};
