import { IntlShape } from 'react-intl';
import { isEmpty } from 'lodash';

export type ErrorType = IError | IGraphqlError;

export type ErrorLevel = 'error' | 'warning';

const NONE = 0;
export const USER_ERROR_RESPONSE_CODE = 400;
export const SERVER_ERROR_RESPONSE_CODE = 500;

export interface IServerError {
  message: string;
  serverResponse?: IServerErrorResponse;
}

interface IServerErrorResponse {
  data: { message: string };
  status?: number;
  statusText?: string;
}

export interface IError {
  code?: string;
  errText?: string;
  level?: ErrorLevel;
}

export interface IGraphqlError {
  response?: {
    errors?: IServerError[];
    status?: number;
  };
  message?: string;
}

const getServerErrorMessage = (serverError: IServerError, intl?: IntlShape): string => {
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

const isIError = (error: ErrorType): error is IError => {
  const IERROR_MARKER_FIELD: keyof IError = 'errText';
  return typeof error === 'object' && error !== null && IERROR_MARKER_FIELD in error;
};

export const getGraphqlErrorItem = (
  error: IGraphqlError | undefined,
  intl: IntlShape
): IError[] => {
  const response = error?.response;

  if (!isEmpty(response) && response) {
    const items: IError[] = (response.errors ?? []).map(
      (responseError) =>
        ({
          errText: getServerErrorMessage(responseError, intl),
          level: 'error',
        } satisfies IError)
    );

    const status = response.status;
    if (status && status >= USER_ERROR_RESPONSE_CODE && status < SERVER_ERROR_RESPONSE_CODE) {
      items.push({
        errText: intl.formatMessage({ id: `general.http-${status}.error` }),
        level: 'error',
      });
    }
    if (status && status >= SERVER_ERROR_RESPONSE_CODE) {
      items.push({ errText: intl.formatMessage({ id: 'general.server.error' }), level: 'error' });
    }

    return items;
  }

  if (error?.message) {
    return [{ errText: error.message, level: 'error' }];
  }

  return [];
};

export const getGraphqlErrorItems = (errors: ErrorType[], intl: IntlShape): IError[] => {
  const graphQLErrors = errors.flatMap((error) =>
    isIError(error) ? [error] : getGraphqlErrorItem(error, intl)
  );
  return graphQLErrors;
};

export const getErrorsItems = (errors: Record<string, string[]>): IError[] => {
  return Object.entries(errors).flatMap(([_, messages]) =>
    messages.map((message) => ({ errText: message, level: 'error' } as IError))
  );
};
