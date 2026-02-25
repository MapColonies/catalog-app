import { isEmpty } from 'lodash';
import moment from 'moment';
import { BASE_PATH } from '../../discrete-layer/components/layer-details/raster/state-machine/types';
import CONFIG from '../config';

export const getDateformatType = (
  withTime = false,
  fnsFormat = false,
  humanReadable = false
): string => {
  if (fnsFormat) {
    if (humanReadable) {
      return withTime
        ? CONFIG.LOCALE.DATE_FNS_HUMAN_READABLE_DATE_TIME
        : CONFIG.LOCALE.DATE_FNS_HUMAN_READABLE_DATE;
    }
    return withTime
      ? CONFIG.LOCALE.DATE_FNS_TIME_FORMAT
      : CONFIG.LOCALE.DATE_FNS_FORMAT;
  }
  return withTime ? CONFIG.LOCALE.DATE_TIME_FORMAT : CONFIG.LOCALE.DATE_FORMAT;
};

export interface FormatterFunc {
  (
    source: string | Date | moment.Moment | undefined,
    option?: boolean | undefined
  ): string;
}

export const stringFormatter: FormatterFunc = (val): string => {
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return val !== undefined ? val.toString() : '';
};

export const dateFormatter: FormatterFunc = (
  date,
  withTime = false
): string => {
  // eslint-disable-next-line
  return date !== undefined && 'toISOString' in (moment(date) as moment.Moment)
    ? moment(date).format(getDateformatType(withTime))
    : '-';
};

export const relativeDateFormatter: FormatterFunc = (date): string => {
  return date !== undefined ? moment(date).fromNow() : '-';
};

export const dateSerializer: FormatterFunc = (date): string => {
  if (typeof date === 'string') {
    try {
      return new Date(date).toISOString();
    } catch (e) {
      return '-';
    }
  }

  if (typeof date !== 'undefined') {
    return date.toISOString();
  }

  return '-';
};

export const emphasizeByHTML: FormatterFunc = (value): string => {
  return `<strong>${value as string}</strong>`;
};

const DEFAULT_DECIMALS = 2;
export const formatBytes = (
  bytes: number,
  decimals = DEFAULT_DECIMALS
): string => {
  const NONE = 0;

  if (!+bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < NONE ? NONE : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const kbToBytes = (n: number): number => {
  const multiplyFactorToBytes = 1024;
  return n * multiplyFactorToBytes;
};

export const normalizePath = (path: string): string => {
  return path.replaceAll('\\', '\\\\');
};

export const formatPath = (path: string): string => {
  let normalizedPath = path.trim();
  if (!isEmpty(normalizedPath)) {
    normalizedPath = normalizedPath.replace(/^\\+/, BASE_PATH);
  }
  return normalizedPath;
};
