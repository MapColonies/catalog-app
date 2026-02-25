export type ErrorLevel = 'error' | 'warning';

export interface IError {
  code?: string;
  message?: string;
  level?: ErrorLevel;
}
