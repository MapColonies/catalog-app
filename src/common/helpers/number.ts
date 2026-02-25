const NOT_FOUND = -1;

export const convertExponentialToDecimal = (
  exponentialNumber: string
): string => {
  if (exponentialNumber.indexOf('e') !== NOT_FOUND) {
    const exponent = parseInt(exponentialNumber.split('-')[1], 10);
    const result = Number(exponentialNumber).toFixed(exponent);
    return result;
  } else {
    return exponentialNumber;
  }
};
