import { useContext, useEffect, useState } from 'react';
import { Feature, FeatureCollection } from 'geojson';
import {
  EstimatedSizeModelType,
  RecordType,
  useQuery,
  useStore,
} from '../../../models';
import EnumsMapContext, {
  IEnumDescriptor,
  IEnumsMapType,
} from '../../../../common/contexts/enumsMap.context';
import { get, isEmpty } from 'lodash';
import { GeojsonFeatureCollectionInput } from '../../../models/RootStore.base';

export const useEstimatedSize = (
  initSelection: Feature | FeatureCollection = {} as Feature
): {
  setSelection: (selection: Feature | FeatureCollection) => void;
  data: number | null | undefined;
  loading: boolean;
  refetch?: () => Promise<{
    getEstimatedSize: EstimatedSizeModelType;
  }>;
  error?: string;
} => {
  const store = useStore();
  const {
    exportStore: { layerToExport },
  } = store;
  const { enumsMap } = useContext(EnumsMapContext);
  const enums = enumsMap as IEnumsMapType;
  const layerRecordType = (
    get(enums, layerToExport?.productType as string) as
      | IEnumDescriptor
      | undefined
  )?.parentDomain as RecordType;

  const [selection, setSelection] = useState(initSelection);

  const { data, loading, setQuery, query } = useQuery<{
    getEstimatedSize: EstimatedSizeModelType;
  }>();

  useEffect(() => {
    if (!isEmpty(selection)) {
      const selectionFeatureCollection: GeojsonFeatureCollectionInput =
        selection.type === 'Feature'
          ? {
              type: 'FeatureCollection',
              features: [
                {
                  ...selection,
                  id: `${
                    (get(selection.properties, 'id') as string | undefined) ??
                    ''
                  }`,
                },
              ],
            }
          : (selection as GeojsonFeatureCollectionInput);

      setQuery(
        store.queryGetEstimatedSize({
          data: {
            type: layerRecordType,
            selections: selectionFeatureCollection,
          },
        })
      );
    }
  }, [selection]);

  return {
    setSelection,
    data: data?.getEstimatedSize.estimatedSizeBytes,
    loading,
    refetch: query?.refetch,
    error: get(query?.error, 'response.errors[0].message') as string,
  };
};
