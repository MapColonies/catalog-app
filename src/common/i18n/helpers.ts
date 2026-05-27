export const isRtl = (locale: string) => {
  return locale.toLowerCase() === 'he';
};

export const getTextDirection = (locale: string) => {
  const isRtlVal = isRtl(locale);
  return isRtlVal ? 'rtl' : 'ltr';
};
