import React, { useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { observer } from 'mobx-react-lite';
import { IconButton, Tooltip, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { existStatus, getTextStyle } from '../../../common/helpers/style';
import { isBeingDeleted } from '../../../common/helpers/layer-url';
import { Mode } from '../../../common/models/mode.enum';
import { EntityDialog } from '../../components/layer-details/entity.dialog';
import { EntityDeleteDialog } from '../../components/layer-details/entity.delete-dialog';
import { LayersDetailsComponent } from '../../components/layer-details/layer-details';
import { PublishButton } from '../../components/layer-details/publish-button';
import { SaveMetadataButton } from '../../components/layer-details/save-metadata-button';
import { EntityDescriptorModelType, LayerMetadataMixedUnion } from '../../models';
import { useStore } from '../../models/RootStore';
import { TabViews } from '../tab-views';

import './details-panel.component.css';

interface DetailsPanelComponentProps {
  isEntityDialogOpen: boolean;
  setEntityDialogOpen: (open: boolean) => void;
  isRasterEntityDialogOpen: boolean;
  setRasterEntityDialogOpen: (open: boolean) => void;
  isEntityDeleteDialogOpen: boolean;
  setEntityDeleteDialogOpen: (open: boolean) => void;
  detailsPanelExpanded: boolean;
  setDetailsPanelExpanded: (isExpanded: boolean) => void;
  activeTabView: TabViews;
}

export const DetailsPanel: React.FC<DetailsPanelComponentProps> = observer((props) => {
  const {
    isEntityDialogOpen,
    setEntityDialogOpen,
    isRasterEntityDialogOpen,
    setRasterEntityDialogOpen,
    isEntityDeleteDialogOpen,
    setEntityDeleteDialogOpen,
    detailsPanelExpanded,
    setDetailsPanelExpanded,
    activeTabView
  } = props;
  
  const store = useStore();
  const intl = useIntl();
  const layerToPresent = store.discreteLayersStore.selectedLayer;
  const isSelectedLayerUpdateMode = store.discreteLayersStore.selectedLayerIsUpdateMode ?? false;
  const isSelectedLayerDeleteMode = store.discreteLayersStore.selectedLayerIsDeleteMode ?? false;
  
  const permissions = useMemo(() => {
    return {
     isEditAllowed: layerToPresent && store.userStore.isActionAllowed(`entity_action.${layerToPresent.__typename}.edit`),
     isPublishAllowed: layerToPresent && store.userStore.isActionAllowed(`entity_action.${layerToPresent.__typename}.publish`),
     isDeleteAllowed: layerToPresent && store.userStore.isActionAllowed(`entity_action.${layerToPresent.__typename}.delete`),
     isSaveMetadataAllowed: layerToPresent && store.userStore.isActionAllowed(`entity_action.${layerToPresent.__typename}.saveMetadata`),
    }
  }, [store.userStore.user, layerToPresent]);

  useEffect(() => {
    if (isEntityDialogOpen && layerToPresent?.__typename === 'LayerRasterRecord' && isSelectedLayerUpdateMode) {
      setRasterEntityDialogOpen(true);
    } else if (isRasterEntityDialogOpen || isEntityDialogOpen) {
      setRasterEntityDialogOpen(false);
      setEntityDialogOpen(!isEntityDialogOpen);
    }
  }, [isEntityDialogOpen, isSelectedLayerUpdateMode]);
  

  const handleEntityDialogClick = (): void => {
    setEntityDialogOpen(!isEntityDialogOpen);
  };

  return (
    <>
      <Box style={{ display: 'flex', paddingTop: '8px' }}>
        <Typography dir="auto" use="headline6" tag="div" className="detailsTitle" style={getTextStyle(layerToPresent as any ?? {}, 'color')}>
          {layerToPresent?.productName}
        </Typography>
        {
          permissions.isPublishAllowed === true && !isBeingDeleted(layerToPresent as LayerMetadataMixedUnion) &&
          layerToPresent &&
          existStatus(layerToPresent as any) &&
          <PublishButton layer={layerToPresent} className="operationIcon"/>
        }
        {
          permissions.isEditAllowed === true && !isBeingDeleted(layerToPresent as LayerMetadataMixedUnion) &&
          <Tooltip content={intl.formatMessage({ id: 'action.edit.tooltip' })}>
            <IconButton
              className="operationIcon mc-icon-Edit1"
              label="EDIT"
              onClick={(): void => {
                handleEntityDialogClick();
              }}
            />
          </Tooltip>
        }
        {
          permissions.isEditAllowed === false && 
          <Tooltip content={intl.formatMessage({ id: 'action.view.tooltip' })}>
            <IconButton
              className="mc-icon-Info"
              label="VIEW"
              onClick={(): void => {
                handleEntityDialogClick();
              }}
            />
          </Tooltip>
        }
        {
          permissions.isDeleteAllowed && layerToPresent && isEntityDeleteDialogOpen && isSelectedLayerDeleteMode &&
          <EntityDeleteDialog
            isOpen={isEntityDeleteDialogOpen}
            onSetOpen={setEntityDeleteDialogOpen}
            layerRecord={layerToPresent}
          />
        }
        {
          isEntityDialogOpen && 
          (layerToPresent?.__typename !== 'LayerRasterRecord' || (layerToPresent?.__typename === 'LayerRasterRecord' && !isSelectedLayerUpdateMode)) &&
          <EntityDialog
            isOpen={isEntityDialogOpen}
            onSetOpen={setEntityDialogOpen}
            layerRecord={layerToPresent}
            isViewMode={!permissions.isEditAllowed}
            isSelectedLayerUpdateMode={isSelectedLayerUpdateMode}
          />
        }
        {
          permissions.isSaveMetadataAllowed === true && layerToPresent &&
          <SaveMetadataButton metadata={layerToPresent} className="operationIcon"/>
        }
        <Tooltip
          content={intl.formatMessage({
            id: `${
              !detailsPanelExpanded
                ? 'action.expand.tooltip'
                : 'action.collapse.tooltip'
            }`,
          })}
        >
          <IconButton
            className={`operationIcon ${
              !detailsPanelExpanded
                ? 'mc-icon-Expand-Panel'
                : 'mc-icon-Collapce-Panel'
            }`}
            label="DETAILS EXPANDER"
            onClick={(): void => {
              setDetailsPanelExpanded(!detailsPanelExpanded);
            }}
          />
        </Tooltip>
      </Box>
      <Box className="detailsContent panelContent">
        <LayersDetailsComponent
          isSearchTab={activeTabView === TabViews.SEARCH_RESULTS}
          className="detailsPanelProductView"
          entityDescriptors={store.discreteLayersStore.entityDescriptors as EntityDescriptorModelType[]}
          layerRecord={layerToPresent}
          isBrief={!detailsPanelExpanded}
          mode={Mode.VIEW}
          intl={intl}
        />
      </Box>
    </>
  );
})