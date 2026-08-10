import React, { useEffect, useMemo, useState } from 'react';
import { Feature } from 'geojson';
import { observer } from 'mobx-react';
import { Mode } from '../../../../common/models/mode.enum';
import { FlyTo } from '../../../../common/components/ol-map/fly-to';
import { RecordType, RootStoreType, useQuery, useStore } from '../../../models';
import { OlLayerRecordTile } from '../../map-container/ol.layer-record.tile';
import { ActionDialogProps, DestructiveActionDialog } from '../destructive-action-dialog';
import { useLayerActionDialog } from '../layer-action-dialog.hook';
import { GeoFeaturesPresentorComponent } from './pp-map';
import { START_RASTER_LAYER_ZINDEX } from './pp-map.utils';

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

    const flyToFeature = useMemo(() => {
      return {
        type: 'Feature',
        properties: {},
        geometry: props.layerRecord.footprint,
      } as Feature;
    }, [props.layerRecord.footprint]);

    const layerCapability = store.discreteLayersStore.getLayerCapability(props.layerRecord);
    const layerOptions = useMemo(() => {
      return {
        extent: props.layerRecord.footprint?.bbox,
        zIndex: START_RASTER_LAYER_ZINDEX,
      };
    }, [props.layerRecord.footprint?.bbox]);

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
        map={
          <GeoFeaturesPresentorComponent
            layerRecord={props.layerRecord}
            mode={Mode.DELETE}
            style={{ height: 'var(--map-height)', position: 'relative', direction: 'ltr' }}
            defaultShowBaseMap={false}
            toggleBaseMap={true}
          >
            <>
              <OlLayerRecordTile
                layerRecord={props.layerRecord}
                capability={layerCapability}
                layerOptions={layerOptions}
              />
              <FlyTo feature={flyToFeature} flyOnce={true}></FlyTo>
            </>
          </GeoFeaturesPresentorComponent>
        }
        onFieldsValidate={() => {
          setMutationError(null);
          setPolygonPartsError(null);
        }}
      />
    );
  }
);
