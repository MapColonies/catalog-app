const HTTP_RESPONSE_ERROR_FEILD = 'error';
const HTTP_RESPONSE_STATUS_FEILD = 'status';
const NONE = 0;

const isHttpError = (response: any) => {
  return (HTTP_RESPONSE_ERROR_FEILD in response);

}

export const getResponseErrorMesssage = (response: any) => {
  let errMessage = '*** UNKNOWN_MSG ***';
  if (isHttpError(response)) {
    errMessage = response[HTTP_RESPONSE_ERROR_FEILD]
      .replace(/<[^>]*>/g, "") // remove tags
      .replace(/\n/g, " ")     // remove \n
      .replace(/\s+/g, " ")    // clean extra spaces
      .trim();
  } else {
    const serverError = response.errors[0];
    errMessage = serverError.serverResponse?.data.message
      ? serverError.serverResponse.data.message
      : serverError.serverResponse?.statusText
      ? serverError.serverResponse?.statusText
      : serverError.message.substring(+serverError.message.indexOf('; ') + 1);

  }
  return errMessage;
}

export const getResponseErrorStatus = (response: any) => {
  let status = '*** UNKNOWN_STATUS ***';
  if (isHttpError(response)) {
    status = response[HTTP_RESPONSE_STATUS_FEILD];
  } else {
    const serverError = response.errors[0];
    status = serverError.serverResponse?.status ?? NONE;
  }
  return status;
}

export const getResponseErrorURL = (response: any) => {
  let url = '*** UNKNOWN_URL ***';
  if (!isHttpError(response)) {
    url = response?.errors?.[0].extensions?.exception?.config?.url;
  }
  return url;
}
