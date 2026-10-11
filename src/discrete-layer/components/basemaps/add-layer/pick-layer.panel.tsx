import React, { useMemo, useState } from 'react';
import { observer } from 'mobx-react';
import { isPublished } from '../../../../common/helpers/style';
import { LayerMetadataMixedUnion } from '../../../models';
import {
  TreeRootSection,
  TreeRootName,
  getAllowedTreeRootSections,
} from '../../../models/catalogTreeStore';
import { ILayerImage } from '../../../models/layerImage';
import { RecordType } from '../../../models/RecordTypeEnum';
import { useStore } from '../../../models/RootStore';
import { CatalogPicker } from '../../catalog-picker/catalog-picker';

const LAYER_ROOTS_NAMES: TreeRootName[] = ['catalog', 'bests'];

const CATALOGS_TO_FETCH = [RecordType.RECORD_RASTER];

export enum BasemapActionSelector {
  CatalogResource,
  External_XYZ,
  External_WMTS,
}

interface PickLayerPanelProps {
  actionSelector: BasemapActionSelector;
  existingLayers?: Record<string, unknown>[];
  onClose: () => void;
}

export const PickLayerPanel: React.FC<PickLayerPanelProps> = observer(
  ({ actionSelector, existingLayers, onClose }) => {
    const store = useStore();
    const [selectedItem, setSelectedItem] = useState<LayerMetadataMixedUnion>();

    const filteredCatalogRoots: TreeRootSection[] = useMemo(
      () =>
        getAllowedTreeRootSections(store.userStore.isUserAdmin())
          .filter((rootSection) => LAYER_ROOTS_NAMES.includes(rootSection.id))
          .map((rootSection) => ({
            ...rootSection,
            predicate: (item: ILayerImage): boolean =>
              isPublished(item as unknown as Record<string, unknown>) &&
              rootSection.predicate(item),
          })),
      [store.userStore.user]
    );

    const isLayerDisabled = (layer: ILayerImage): boolean => {
      const layerRecord = layer as unknown as Record<string, unknown>;
      return (
        existingLayers?.some((existingLayer) => {
          const entries = Object.entries(existingLayer);
          return entries.length > 0 && entries.every(([key, value]) => layerRecord[key] === value);
        }) ?? false
      );
    };

    return (
      <>
        {actionSelector === BasemapActionSelector.CatalogResource && (
          <CatalogPicker
            catalogsToFetch={CATALOGS_TO_FETCH}
            treeRootSections={filteredCatalogRoots}
            disableLayerPredicate={isLayerDisabled}
            setSelectedLayer={setSelectedItem}
            onClose={onClose}
          />
        )}
      </>
    );
  }
);
