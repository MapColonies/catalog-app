import { IntlShape } from 'react-intl';
import { isEmpty } from 'lodash';

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
  // errParams?: relevant to error CODE should be supplied here
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

type FormattableError = IError | IGraphqlError | string;

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

const isIError = (error: unknown): error is IError => {
  const IERROR_MARKER_FIELD: keyof IError = 'errText';
  return typeof error === 'object' && error !== null && IERROR_MARKER_FIELD in error;
};

const getGraphqlErrorItem = (error: IGraphqlError | undefined, intl: IntlShape): IError[] => {
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
    return [{ errText: getServerErrorMessage({ message: error.message }, intl), level: 'error' }];
  }

  return [];
};

const applyErrorMetadata = (error: IError, level: ErrorLevel = 'error', code?: string): IError => ({
  ...error,
  level,
  code,
});

export const formatError = (
  intl: IntlShape,
  error: FormattableError,
  level: ErrorLevel = 'error',
  code?: string
): IError[] => {
  if (typeof error === 'string') {
    return [{ errText: error, level, code }];
  }

  if (isIError(error)) {
    return [applyErrorMetadata(error, level, code)];
  }

  // Also handles generic Error instances
  return getGraphqlErrorItem(error as IGraphqlError, intl).map((error) =>
    applyErrorMetadata(error, level, code)
  );
};

export const formatErrors = (errors: FormattableError[], intl: IntlShape): IError[] => {
  return errors.flatMap((error) => formatError(intl, error));
};
