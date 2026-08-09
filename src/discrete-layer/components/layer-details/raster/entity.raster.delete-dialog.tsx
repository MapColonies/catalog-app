import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { Mode } from '../../../../common/models/mode.enum';
import { RecordType, RootStoreType, useQuery, useStore } from '../../../models';
import { ActionMap } from '../action-map';
import { ActionDialogProps, DestructiveActionDialog } from '../destructive-action-dialog';
import { useLayerActionDialog } from '../layer-action-dialog.hook';

import './entity.raster.delete-dialog.css';

type DeleteRasterLayerResult = Awaited<ReturnType<RootStoreType['mutateDeleteRasterLayer']>>; // see (MAPCO-11216)

export const EntityDeleteRasterDialog: React.FC<ActionDialogProps> = observer(
  (props: ActionDialogProps) => {
    const store = useStore();
    const mutationQuery = useQuery<DeleteRasterLayerResult>();

    const [mutationError, setMutationError] = useState<any>(null);
    const [polygonPartsError, setPolygonPartsError] = useState<Record<string, string[]> | null>(
      null
    );

    const { dialogTitleParamTranslation, closeDialog, disclaimer } = useLayerActionDialog({
      onSetOpen: props.onSetOpen,
      layerRecord: props.layerRecord,
      recordType: RecordType.RECORD_RASTER,
    });

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
        dialogTitleParamTranslation={dialogTitleParamTranslation}
        disclaimer={disclaimer}
        onClose={closeDialog}
        onSubmit={deleteLayer}
        loading={mutationQuery.loading}
        error={mutationError}
        polygonPartsError={polygonPartsError}
        map={<ActionMap layerRecord={props.layerRecord} />}
        onFieldsValidate={() => {
          setMutationError(null);
          setPolygonPartsError(null);
        }}
      />
    );
  }
);
