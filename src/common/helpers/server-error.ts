const HTTP_RESPONSE_ERROR_FIELD = 'error';
const HTTP_RESPONSE_STATUS_FIELD = 'status';
const NONE = 0;

const isHttpError = (response: any) => {
  return HTTP_RESPONSE_ERROR_FIELD in response;
};

export const getResponseErrorMesssage = (response: any) => {
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

export const getResponseErrorStatus = (response: any) => {
  let status = '*** UNKNOWN_STATUS ***';
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

export const getResponseErrorURL = (response: any) => {
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
