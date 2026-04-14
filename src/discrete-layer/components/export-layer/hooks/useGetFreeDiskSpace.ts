import { useContext, useEffect } from 'react';
import { get } from 'lodash';
import EnumsMapContext, {
  IEnumDescriptor,
  IEnumsMapType,
} from '../../../../common/contexts/enumsMap.context';
import { getResponseErrorMesssage } from '../../../../common/helpers/server-error';
import { FreeDiskSpaceModelType, RecordType, useQuery, useStore } from '../../../models';

export const useGetFreeDiskSpace = (): {
  data: number | null | undefined;
  loading: boolean;
  refetch?: () => Promise<{ getFreeDiskSpace: FreeDiskSpaceModelType }>;
  error?: string;
} => {
  const store = useStore();
  const {
    exportStore: { layerToExport },
  } = store;
  const { enumsMap } = useContext(EnumsMapContext);
  const enums = enumsMap as IEnumsMapType;
  const layerRecordType = (
    get(enums, layerToExport?.productType as string) as IEnumDescriptor | undefined
  )?.parentDomain as RecordType;

  const { data, loading, query, setQuery } = useQuery<{
    getFreeDiskSpace: FreeDiskSpaceModelType;
  }>();

  useEffect(() => {
    setQuery(
      store.queryGetFreeDiskSpace({
        data: {
          type: layerRecordType,
        },
      })
    );
  }, []);

  return {
    data: data?.getFreeDiskSpace.freeDiskSpaceBytes,
    loading,
    refetch: query?.refetch,
    error: getResponseErrorMesssage(query?.error?.response),
  };
};
