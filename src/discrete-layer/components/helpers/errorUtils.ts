import { IntlShape } from 'react-intl';
import { isEmpty } from 'lodash';
import {
  getErrorMessage,
  IServerError,
  SERVER_ERROR_RESPONSE_CODE,
  USER_ERROR_RESPONSE_CODE,
} from '../../../common/components/error/helpers';

export type ErrorType = IError | IGraphqlError | undefined;

export type ErrorLevel = 'error' | 'warning';

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

const isIError = (error: unknown): error is IError => {
  const IERROR_MARKER_FIELD: keyof IError = 'errText';
  return typeof error === 'object' && error !== null && IERROR_MARKER_FIELD in error;
};

export const getGraphqlErrorItem = (error: unknown, intl: IntlShape): IError[] => {
  const graphqlError = error as IGraphqlError;

  if (!isEmpty(graphqlError?.response)) {
    const items: IError[] = (graphqlError.response?.errors ?? []).map((responseError) => ({
      title: getErrorMessage(responseError, intl),
      level: 'error',
    }));

    const status = graphqlError.response?.status;
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

  if (!isEmpty(graphqlError?.message)) {
    return [
      { errText: getErrorMessage(graphqlError as unknown as IServerError, intl), level: 'error' },
    ];
  }

  return [];
};

export const getGraphqlErrorItems = (errors: unknown[], intl: IntlShape): IError[] => {
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
