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

const getServerErrorItemMessage = (intl: IntlShape, serverError: IServerError): string => {
  const status = serverError.serverResponse?.status ?? NONE;
  const message = serverError.serverResponse?.data.message
    ? serverError.serverResponse.data.message
    : serverError.serverResponse?.statusText ?? '';
  if (status && status >= USER_ERROR_RESPONSE_CODE && status < SERVER_ERROR_RESPONSE_CODE) {
    const translatedError =
      intl.formatMessage({ id: `general.http-${status}.error` }) ?? 'HTTP_ERROR_TRANSLATION';
    return `${translatedError}<br/>${message}`;
  } else if (message) {
    return message;
  } else {
    return (
      serverError.message?.substring(+serverError.message.indexOf('; ') + 1) ?? serverError.message
    );
  }
};

const isIError = (error: unknown): error is IError => {
  const IERROR_MARKER_FIELD: keyof IError = 'errText';
  return typeof error === 'object' && error !== null && IERROR_MARKER_FIELD in error;
};

function updateErrorItemMetadata(error: IError, level?: ErrorLevel, code?: string): IError {
  const levelErr = level ?? error.level ?? 'error';
  const codeErr = code ?? error.code;

  return {
    ...error,
    level: levelErr,
    code: codeErr,
  };
}

function createErrorItem(errorText: string, level?: ErrorLevel, code?: string): IError {
  return updateErrorItemMetadata({ errText: errorText }, level, code);
}

const getGraphqlErrorItem = (
  intl: IntlShape,
  error: IGraphqlError | undefined,
  level?: ErrorLevel,
  code?: string
): IError[] => {
  const response = error?.response;

  if (!isEmpty(response) && response) {
    const items: IError[] = (response.errors ?? []).map((responseError) =>
      createErrorItem(getServerErrorItemMessage(intl, responseError), level, code)
    );

    const status = response.status;
    if (status && status >= USER_ERROR_RESPONSE_CODE && status < SERVER_ERROR_RESPONSE_CODE) {
      items.push(
        createErrorItem(intl.formatMessage({ id: `general.http-${status}.error` }), level, code)
      );
    }
    if (status && status >= SERVER_ERROR_RESPONSE_CODE) {
      items.push(createErrorItem(intl.formatMessage({ id: 'general.server.error' }), level, code));
    }

    return items;
  }

  if (error?.message) {
    return [
      createErrorItem(getServerErrorItemMessage(intl, { message: error.message }), level, code),
    ];
  }

  return [];
};

export const formatError = (
  intl: IntlShape,
  error: FormattableError | undefined | null,
  level?: ErrorLevel,
  code?: string
): IError[] | undefined => {
  if (error === undefined || error === null) {
    return undefined;
  }

  if (typeof error === 'string') {
    return [createErrorItem(error, level, code)];
  }

  if (isIError(error)) {
    return [updateErrorItemMetadata(error, level, code)];
  }

  // Also handles generic Error instances
  return getGraphqlErrorItem(intl, error as IGraphqlError, level, code);
};

export const formatErrors = (
  intl: IntlShape,
  errors: (FormattableError | undefined | null)[]
): IError[] => {
  return errors.flatMap((error) => formatError(intl, error) ?? []);
};

const HTTP_RESPONSE_ERROR_FIELD = 'error';
const HTTP_RESPONSE_STATUS_FIELD = 'status';

const isHttpError = (response: any): boolean => {
  return HTTP_RESPONSE_ERROR_FIELD in response;
};

export const getResponseErrorMesssage = (response: any): string => {
  let errMessage = '*** UNKNOWN_MSG ***';
  if (response) {
    if (isHttpError(response)) {
      errMessage = response[HTTP_RESPONSE_ERROR_FIELD].replace(/<[^>]*>/g, '') // remove tags
        .replace(/\n/g, ' ') // remove \n
        .replace(/\s+/g, ' ') // clean extra spaces
        .trim();
    } else {
      const serverError = response.errors[0];
      errMessage = serverError.serverResponse?.data.message
        ? serverError.serverResponse.data.message
        : serverError.serverResponse?.statusText
        ? serverError.serverResponse?.statusText
        : serverError.message.substring(+serverError.message.indexOf('; ') + 1);
    }
  } else {
    errMessage = '';
  }
  return errMessage;
};

export const getResponseErrorStatus = (response: any): number | string => {
  let status: number | string = '*** UNKNOWN_STATUS ***';
  if (response) {
    if (isHttpError(response)) {
      status = response[HTTP_RESPONSE_STATUS_FIELD];
    } else {
      const serverError = response.errors[0];
      status = serverError.serverResponse?.status ?? NONE;
    }
  } else {
    status = '';
  }
  return status;
};

export const getResponseErrorURL = (response: any): string => {
  let url = '*** UNKNOWN_URL ***';
  if (response) {
    if (!isHttpError(response)) {
      url = response?.errors?.[0].extensions?.exception?.config?.url;
    }
  } else {
    url = '';
  }
  return url;
};
