import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  getValidationMessage,
  ValidationMessage,
} from '../../discrete-layer/components/layer-details/utils';
import { SYNC_QUERY_NAME } from '../../syncHttpClientGql';
import { sessionStore } from '../helpers/storage';

const useSessionStoreWatcherForm = () => {
  const intl = useIntl();
  const [validationWarn, setValidationWarn] = useState<ValidationMessage>();

  useEffect(() => {
    const callbackAfter = (method: string, key: string) => {
      switch (true) {
        case key.includes(SYNC_QUERY_NAME.GET_PRODUCT): {
          switch (method) {
            case 'setItem': {
              const data = sessionStore.getObject(SYNC_QUERY_NAME.GET_PRODUCT);
              if (data) {
                setValidationWarn(getValidationMessage(data, intl));
              }
              break;
            }
            case 'removeItem': {
              setValidationWarn(undefined);
              break;
            }
          }
          break;
        }
        case key.includes(SYNC_QUERY_NAME.VALIDATE_SOURCE): {
          switch (method) {
            case 'setItem': {
              const data = sessionStore.getObject(
                SYNC_QUERY_NAME.VALIDATE_SOURCE
              );
              if (
                data &&
                !data.isValid &&
                !sessionStore.getObject(SYNC_QUERY_NAME.GET_PRODUCT)
              ) {
                setValidationWarn(getValidationMessage(data, intl));
              }
              break;
            }
            case 'removeItem': {
              setValidationWarn(undefined);
              break;
            }
          }
          break;
        }
        default:
          break;
      }
    };

    sessionStore.watchMethods(
      ['setItem', 'removeItem'],
      () => {},
      callbackAfter
    );

    return () => {
      sessionStore.unWatchMethods();
    };
  }, [intl]);

  return validationWarn;
};

export default useSessionStoreWatcherForm;
