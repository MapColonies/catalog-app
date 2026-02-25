export const camelize = (value: string): string => {
  return value
    .toLowerCase()
    .replace(
      /^([A-Z])|[\s-_]+(\w)/g,
      (match, p1: string, p2: string, offset) => {
        if (p2) return p2.toUpperCase();
        return p1.toLowerCase();
      }
    );
};

export const extractJsonObjFromString = <T = Record<string, unknown>>(
  input: string
): T | undefined => {
  const FIRST_MATCH = 0;
  const jsonRegex = new RegExp(/\{(?:[^{}]|(R))*\}/);
  const match = jsonRegex.exec(input)?.[FIRST_MATCH];

  if (typeof match === 'string') return JSON.parse(match) as T;
};
