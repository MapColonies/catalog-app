import { isObject, isPlainObject, cloneDeep } from 'lodash';

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

const stripKeysDeep = (value: unknown, keys: string[]): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => stripKeysDeep(item, keys));
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !keys.includes(key))
        .map(([key, val]) => [key, stripKeysDeep(val, keys)])
    );
  }
  return value;
};

/**
 * Recursively removes the given keys (e.g. GraphQL's `__typename`) from a value, at every nesting
 * level of plain objects/arrays. `cloneDeep`s first so this is safe to call with a live mst-gql model
 * instance: its props are its own plain enumerable fields, but its views/actions (e.g. `store`) live
 * on the prototype and aren't cloned, so the result is just the plain data with the keys stripped.
 */
export const omitDeep = <T>(value: T, keys: string[]): T =>
  stripKeysDeep(cloneDeep(value), keys) as T;
