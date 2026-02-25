/* eslint-disable */
import { observer } from 'mobx-react';
import React, { useContext, useEffect } from 'react';
import lookupTablesContext, {
  ILookupTableData,
} from '../../../../common/contexts/lookupTables.context';
import { useStore, useQuery } from '../../../models/RootStore';
import { Error } from './../../../../common/components/tree/statuses/error';
import { queue } from '../../../../discrete-layer/components/snackbar/notification-queue';

export const HOT_AREAS_TABLES_KEY = 'hotAreas';

export const LookupTablesFetcher: React.FC = observer(() => {
  const store = useStore();
  const { data, loading, error } = useQuery((store) =>
    store.queryGetLookupTablesData(
      { data: { lookupFields: [{ lookupTable: HOT_AREAS_TABLES_KEY }] } },
      `dictionary`
    )
  );
  const { setLookupTablesData } = useContext(lookupTablesContext);

  useEffect(() => {
    if (!loading) {
      setLookupTablesData(data?.getLookupTablesData as ILookupTableData);
    }
  }, [data, loading, store.discreteLayersStore]);

  useEffect(() => {
    if (error) {
      queue.notify({
        body: (
          <Error
            className="errorNotification"
            message={error.response?.errors[0].message}
            details={
              error.response?.errors[0].extensions?.exception?.config?.url
            }
          />
        ),
      });
    }
  }, [error]);

  return null;
});
