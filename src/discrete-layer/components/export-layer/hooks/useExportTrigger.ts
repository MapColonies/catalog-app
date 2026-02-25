import { get, isEmpty } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import EnumsMapContext, {
  IEnumDescriptor,
  IEnumsMapType,
} from '../../../../common/contexts/enumsMap.context';
import {
  RecordType,
  TriggerExportTaskModelType,
  useQuery,
  useStore,
} from '../../../models';

export interface ExportTriggerParams {
  catalogRecordID: string;
  type: RecordType;
  parameters: Record<string, unknown>;
}

const EXTERNAL_FIELDS_ID = 0;
const EXTERNAL_FIELDS_IDX = 0;

interface ExportTriggerOpts {
  setFormValues: (values: Record<string, unknown>) => void;
  data: TriggerExportTaskModelType | undefined;
  loading: boolean;
  error: unknown;
}

export const useExportTrigger = (): ExportTriggerOpts => {
  const store = useStore();
  const {
    exportStore: {
      geometrySelectionsCollection,
      layerToExport,
      isFullLayerExportEnabled,
    },
  } = store;
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const { enumsMap } = useContext(EnumsMapContext);
  const enums = enumsMap as IEnumsMapType;
  const layerRecordType = (
    get(enums, layerToExport?.productType as string) as
      | IEnumDescriptor
      | undefined
  )?.parentDomain as RecordType;

  const { data, loading, setQuery, query } = useQuery<{
    triggerExportTask: TriggerExportTaskModelType;
  }>();

  useEffect(() => {
    if (!isEmpty(formValues)) {
      const externalFields = Object.entries(formValues).filter(([key]) => {
        const [selectionIdx, , selectionId] = key.split('_'); // selectionIdx_fieldName_selectionId;

        return (
          +selectionIdx === EXTERNAL_FIELDS_IDX &&
          +selectionId === EXTERNAL_FIELDS_ID
        );
      });

      const exportPayload = externalFields.reduce(
        (payloadObj, [key, value]) => {
          const [, fieldName] = key.split('_');
          return {
            ...payloadObj,
            parameters: {
              ...payloadObj.parameters,
              [fieldName]: value,
            },
          };
        },
        {
          catalogRecordID: layerToExport?.id,
          type: layerRecordType,
          parameters: {
            roi: geometrySelectionsCollection,
            isFullLayerExport: isFullLayerExportEnabled,
          },
        } as ExportTriggerParams
      );

      setQuery(store.queryTriggerExportTask({ data: { ...exportPayload } }));
    }
  }, [formValues]);

  return {
    setFormValues,
    data: data?.triggerExportTask,
    loading,
    error: query?.error as unknown,
  };
};
