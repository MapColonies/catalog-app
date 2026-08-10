import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { Mode } from '../../../../common/models/mode.enum';
import { RecordType, RootStoreType, useQuery, useStore } from '../../../models';
import { ActionDialogProps, DestructiveActionDialog } from '../destructive-action-dialog';

import './entity.raster.delete-dialog.css';
import { OlLayerMap } from './layer-map';

type DeleteRasterLayerResult = Awaited<ReturnType<RootStoreType['mutateDeleteRasterLayer']>>; // see (MAPCO-11216)

export const EntityDeleteRasterDialog: React.FC<ActionDialogProps> = observer(
  (props: ActionDialogProps) => {
    const store = useStore();
    const mutationQuery = useQuery<DeleteRasterLayerResult>();

    const [mutationError, setMutationError] = useState<any>(null);
    const [polygonPartsError, setPolygonPartsError] = useState<Record<string, string[]> | null>(
      null
    );

    const closeDialog = (): void => {
      props.onSetOpen(false);
    };

    useEffect(() => {
      if (store.discreteLayersStore.customValidationError) {
        setPolygonPartsError(store.discreteLayersStore.customValidationError);
        setMutationError(null);
      } else {
        setPolygonPartsError(null);
      }
    }, [store.discreteLayersStore.customValidationError]);

    useEffect(() => {
      return () => {
        store.discreteLayersStore.clearCustomValidationError();
      };
    }, []);

    useEffect(() => {
      if (mutationQuery.data && !mutationQuery.error) {
        props.onSuccess?.();
        props.onSetOpen(false);
      }
      if (mutationQuery.error) {
        setMutationError(mutationQuery.error);
        setPolygonPartsError(null);
      }
    }, [mutationQuery.data, mutationQuery.error]);

    const deleteLayer = (approverName: string, approvalCode: string): void => {
      mutationQuery.setQuery(
        store.mutateDeleteRasterLayer({
          data: {
            id: props.layerRecord.id,
            type: props.layerRecord.type as RecordType,
            approverName,
            approvalCode,
          },
        })
      );
    };

    return (
      <DestructiveActionDialog
        elementId="rasterDeleteDialog"
        action={Mode.DELETE}
        isOpen={props.isOpen}
        layerRecord={props.layerRecord}
        recordType={RecordType.RECORD_RASTER}
        disclaimerActionId="action.dialog.delete"
        onClose={closeDialog}
        onSubmit={deleteLayer}
        loading={mutationQuery.loading}
        error={mutationError}
        polygonPartsError={polygonPartsError}
        map={
          <OlLayerMap
            layerRecord={props.layerRecord}
            showBaseMap={{ value: false, showToggleButton: true }}
            showPolygonParts={{ value: false, showCheckbox: true }}
            style={{ height: 'var(--map-height)', position: 'relative', direction: 'ltr' }}
          ></OlLayerMap>
        }
        onFieldsValidate={() => {
          setMutationError(null);
          setPolygonPartsError(null);
        }}
      />
    );
  }
);
