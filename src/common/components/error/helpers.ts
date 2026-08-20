import { IntlShape } from 'react-intl';

export interface IServerError {
  message: string;
  serverResponse?: IServerErrorResponse;
}

interface IServerErrorResponse {
  data: { message: string };
  status?: number;
  statusText?: string;
}

const NONE = 0;
export const USER_ERROR_RESPONSE_CODE = 400;
export const SERVER_ERROR_RESPONSE_CODE = 500;

export const getErrorMessage = (serverError: IServerError, intl?: IntlShape): string => {
  const status = serverError.serverResponse?.status ?? NONE;
  const message = serverError.serverResponse?.data.message
    ? serverError.serverResponse.data.message
    : serverError.serverResponse?.statusText ?? '';
  if (status && status >= USER_ERROR_RESPONSE_CODE && status < SERVER_ERROR_RESPONSE_CODE) {
    const translatedError =
      intl?.formatMessage({ id: `general.http-${status}.error` }) ?? 'HTTP_ERROR_TRANSLATION';
    return `${translatedError}<br/>${message}`;
  } else if (message) {
    return message;
  } else {
    return (
      serverError.message.substring(+serverError.message.indexOf('; ') + 1) ?? serverError.message
    );
  }
};
