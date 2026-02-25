import _ from 'lodash';

export const isArrayEqual = (x: Array<unknown>, y: Array<unknown>) => {
  return _(x).differenceWith(y, _.isEqual).isEmpty();
};

export const is2dArray = (array: [] | [][]) =>
  array.every((item) => Array.isArray(item));

export const getMax = (array: number[]): number =>
  array.reduce((prev, current) => (prev > current ? prev : current));
