import { isObject, cloneDeep } from 'lodash';

// eslint-disable-next-line @typescript-eslint/ban-types
export function hasOwnProperty<X extends {}, Y extends PropertyKey>(
  obj: X,
  prop: Y
): obj is X & Record<Y, unknown> {
  // eslint-disable-next-line no-prototype-builtins
  return obj.hasOwnProperty(prop);
}

export const mergeRecursive = (
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>
): Record<string, unknown> => {
  const retObj = cloneDeep(obj1);
  for (let p in obj2) {
    try {
      // Property in destination object set; update its value.
      if (isObject(obj2[p])) {
        retObj[p] = mergeRecursive(
          retObj[p] as Record<string, unknown>,
          obj2[p] as Record<string, unknown>
        );
      } else {
        retObj[p] = obj2[p];
      }
    } catch (e) {
      // Property in destination object not set; create it and set its value.
      retObj[p] = obj2[p];
    }
  }

  return retObj;
};

export const removePropertiesWithPrefix = (obj: any, prefix: string): any => {
  for (const key in obj) {
    if (key.startsWith(prefix)) {
      delete obj[key];
    }
  }
  return obj;
};
