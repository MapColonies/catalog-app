import { Box } from '@map-colonies/react-components';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect } from 'react';
import { Feature } from 'geojson';
import { isPolygonContainedInLayer } from '../helpers/layersUtils';
import { LayerMetadataMixedUnion, useStore } from '../../models';
import ExportLayerFooter from './export-layer-footer.component';
import ExportLayerHeader from './export-layer-header.component';
import { useGeneralExportBehavior } from './hooks/useGeneralExportBehavior';
import './export-layer.component.css';
import ExportSelectionFieldsContainer from './export-selection-fields-container.component';
import { FormProvider, useForm } from 'react-hook-form';
import { isEmpty } from 'lodash';
import { TabViews } from '../../views/tab-views';
import { ExportActions } from './hooks/useDomainExportActionsConfig';
import ExportLayerFinalStage from './export-layer.finalStage.component';

interface ExportLayerComponentProps {
  style?: { [key: string]: string };
  handleFlyTo: () => void;
  handleTabViewChange: (tabView: TabViews) => void;
}

export const ExportLayerComponent: React.FC<ExportLayerComponentProps> =
  observer(({ style, handleFlyTo, handleTabViewChange }) => {
    const store = useStore();
    const formMethods = useForm({
      mode: 'onBlur',
      reValidateMode: 'onBlur',
    });

    const layerToExport = store.exportStore.layerToExport;
    const finalJobId = store.exportStore.finalJobId;

    useGeneralExportBehavior(() => {
      if (isEmpty(store.exportStore.geometrySelectionsCollection.features)) {
        if (
          !isPolygonContainedInLayer(
            store.discreteLayersStore.mapViewerExtentPolygon as Feature,
            layerToExport as LayerMetadataMixedUnion
          )
        ) {
          handleFlyTo();
        }
      }
    });

    const {
      formState: { isSubmitted },
    } = formMethods;

    useEffect(() => {
      return (): void => {
        // Save form data to store.
        if (!isSubmitted) {
          store.exportStore.setFormData(formMethods.getValues());
        } else {
          store.exportStore.resetFormData();
        }
      };
    }, [isSubmitted]);

    const endExportSession = useCallback(() => {
      store.actionDispatcherStore.dispatchAction({
        action: ExportActions.END_EXPORT_SESSION,
        data: {},
      });
    }, []);

    const tabContentByMode = (): JSX.Element => {
      if (!isEmpty(finalJobId)) {
        return (
          <ExportLayerFinalStage
            onClose={endExportSession}
            jobId={finalJobId as string}
          />
        );
      }

      return (
        <FormProvider {...formMethods}>
          <form className="exportLayerForm" id={'exportForm'}>
            <ExportSelectionFieldsContainer />
          </form>
          <ExportLayerFooter
            handleTabViewChange={handleTabViewChange}
            onExportSuccess={(jobId: string): void => {
              store.exportStore.setFinalJobId(jobId);
            }}
          />
        </FormProvider>
      );
    };

    return (
      <Box style={style}>
        {typeof layerToExport !== 'undefined' && (
          <Box className="exportTabContainer">
            <ExportLayerHeader />
            {tabContentByMode()}
          </Box>
        )}
      </Box>
    );
  });
