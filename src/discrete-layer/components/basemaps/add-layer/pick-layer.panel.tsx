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

export enum BasemapActionSelector {
  CatalogResource,
  External_XYZ,
  External_WMTS,
}

interface PickLayerPanelProps {
  actionSelector: BasemapActionSelector;
  onClose: () => void;
}

export const PickLayerPanel: React.FC<PickLayerPanelProps> = observer(
  ({ actionSelector, onClose }) => {
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

    return (
      <>
        {actionSelector === BasemapActionSelector.CatalogResource && (
          <CatalogPicker
            catalogsToFetch={[RecordType.RECORD_RASTER]}
            treeRootSections={filteredCatalogRoots}
            disableItemsByUniqueness={undefined}
            setSelectedItem={setSelectedItem}
            onClose={onClose}
          />
        )}
      </>
    );
  }
);
