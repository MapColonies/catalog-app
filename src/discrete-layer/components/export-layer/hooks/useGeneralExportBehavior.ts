import { useContext, useEffect, useMemo } from 'react';
import { get } from 'lodash';
import EnumsMapContext, {
  IEnumDescriptor,
  IEnumsMapType,
} from '../../../../common/contexts/enumsMap.context';
import { RecordType, useStore } from '../../../models';
import { ExportActions } from './useDomainExportActionsConfig';

/**
 * Set selected layer and layersImages (Only one layer).
 * Show the layer's tiles and fly to it.
 *
 * For 3D:
 *  Toggle full export mode.
 */
export const useGeneralExportBehavior = (cbFunction: () => void): void => {
  const store = useStore();
  const layerToExport = store.exportStore.layerToExport;

  const { enumsMap } = useContext(EnumsMapContext);
  const enums = enumsMap as IEnumsMapType;
  const layerRecordType = useMemo(
    () =>
      (
        get(enums, layerToExport?.productType as string) as
          | IEnumDescriptor
          | undefined
      )?.parentDomain as RecordType,
    [layerToExport]
  );

  useEffect(() => {
    if (layerToExport) {
      store.discreteLayersStore.selectLayer(layerToExport);

      store.discreteLayersStore.setLayersImages([layerToExport], true);
      store.discreteLayersStore.showLayer(layerToExport.id, true, null);
      store.discreteLayersStore.showPolygonParts(layerToExport.id, true);

      cbFunction();

      switch (layerRecordType) {
        case RecordType.RECORD_3D: {
          const INVOKE_ON_CLEAN_STACK = 0;

          setTimeout(() => {
            store.actionDispatcherStore.dispatchAction({
              action: ExportActions.TOGGLE_FULL_LAYER_EXPORT,
              data: {
                is3DInit: true,
              },
            });
          }, INVOKE_ON_CLEAN_STACK);
          break;
        }

        default:
          break;
      }
    }
  }, [layerToExport]);
};
