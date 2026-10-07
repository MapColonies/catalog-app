import React, { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import { changeNodeAtPath, ExtendedNodeData, map } from 'react-sortable-tree';
import { Button, useTheme } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { TreeComponent, TreeItem } from '../../../common/components/tree';
import { ProductTypeRenderer } from '../../../common/components/tree/icon-renderers/product-type.icon-renderer';
import { Error } from '../../../common/components/tree/statuses/error';
import { Loading } from '../../../common/components/tree/statuses/loading';
import { getTextStyle } from '../../../common/helpers/style';
import { LinkType } from '../../../common/models/link-type.enum';
import { Mode } from '../../../common/models/mode.enum';
import { EntityDescriptorModelType, LayerMetadataMixedUnion } from '../../models';
import { CapabilityModelType } from '../../models/CapabilityModel';
import { TreeRootSection } from '../../models/catalogTreeStore';
import { ILayerImage } from '../../models/layerImage';
import { RecordType } from '../../models/RecordTypeEnum';
import { useStore } from '../../models/RootStore';
import { FilterField } from '../../models/RootStore.base';
import { getResponseErrorMesssage, getResponseErrorURL } from '../helpers/errorUtils';
import { getLinkUrlWithToken } from '../helpers/layersUtils';
import { LayersDetailsComponent } from '../layer-details/layer-details';
import { queue } from '../snackbar/notification-queue';

import '../catalog-tree/catalog-tree.css';
import './catalog-picker.css';

// @ts-ignore
const keyFromTreeIndex = ({ treeIndex }) => treeIndex;

const catalogFilter = (recordType: RecordType): FilterField[] => [
  {
    field: 'mc:type',
    eq: recordType,
  },
];

interface CatalogPickerProps {
  catalogsToFetch: RecordType[];
  treeRootSections: TreeRootSection[];
  disableItemsByUniqueness: Record<string, unknown>[] | undefined;
  setSelectedItem: (record: LayerMetadataMixedUnion) => void;
  onClose: () => void;
}

const isLayerDisabled = (
  layer: ILayerImage,
  uniquenessCriteria: Record<string, unknown>[] | undefined
): boolean => {
  const layerFields = layer as unknown as Record<string, unknown>;
  return (
    uniquenessCriteria?.some((uniqueness) => {
      const entries = Object.entries(uniqueness);
      return entries.length > 0 && entries.every(([key, value]) => layerFields[key] === value);
    }) ?? false
  );
};

export const CatalogPicker: React.FC<CatalogPickerProps> = observer(
  ({ catalogsToFetch, treeRootSections, disableItemsByUniqueness, setSelectedItem, onClose }) => {
    const store = useStore();
    const intl = useIntl();
    const theme = useTheme();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<any>();
    const [records, setRecords] = useState<ILayerImage[]>([]);
    const [treeData, setTreeData] = useState<TreeItem[]>([]);
    const [selectedLayer, setSelectedLayer] = useState<ILayerImage>();

    const fetchCapabilities = async (layers: ILayerImage[]): Promise<CapabilityModelType[]> => {
      try {
        return await store.catalogTreeStore.fetchLayersCapabilities(layers);
      } catch (e) {
        const capabilitiesError = e as any;
        queue.notify({
          body: (
            <Error
              className="errorNotification"
              message={getResponseErrorMesssage(capabilitiesError?.response)}
              details={getResponseErrorURL(capabilitiesError?.response)}
            />
          ),
        });
        return [];
      }
    };

    useEffect(() => {
      const fetchCatalog = async (): Promise<void> => {
        try {
          const fetchedLayers = (await store.discreteLayersStore.fetchCatalogs(
            catalogFilter,
            catalogsToFetch
          )) as ILayerImage[];
          const layersCapabilities = await fetchCapabilities(fetchedLayers);
          const layers = store.discreteLayersStore
            .getPreparedLayersImages(fetchedLayers, true, layersCapabilities)
            .map((layer) => ({
              ...layer,
              isDisabled: isLayerDisabled(layer, disableItemsByUniqueness),
            }));

          setRecords(layers);
          setTreeData(store.catalogTreeStore.createCatalogTree(layers, treeRootSections));
          setIsLoading(false);
        } catch (e) {
          setIsLoading(false);
          setError(e);
        }
      };

      void fetchCatalog();
    }, []);

    const resetSelectedTreeData = (treeData: TreeItem[]) =>
      map({
        treeData,
        getNodeKey: keyFromTreeIndex,
        ignoreCollapsed: false,
        callback: ({ node }: { node: TreeItem }) =>
          node.isSelected ? { ...node, isSelected: false } : node,
      }) as TreeItem[];

    const handleRowClick = (rowInfo: ExtendedNodeData): void => {
      if (rowInfo.node.isGroup || rowInfo.node.isDisabled) {
        return;
      }

      const clearedTreeData = resetSelectedTreeData(treeData);

      setTreeData(
        changeNodeAtPath({
          treeData: clearedTreeData,
          path: rowInfo.path,
          getNodeKey: keyFromTreeIndex,
          newNode: { ...rowInfo.node, isSelected: true },
        })
      );
      setSelectedLayer(records.find((record) => record.id === rowInfo.node.id));
    };

    const handleSelect = (): void => {
      if (selectedLayer) {
        setSelectedItem(selectedLayer);
        onClose();
      }
    };

    if (error) {
      return (
        <Error
          className="errorMessage"
          message={getResponseErrorMesssage(error.response)}
          details={getResponseErrorURL(error.response)}
        />
      );
    }

    return (
      <Box className="catalogPicker">
        {isLoading && <Loading />}
        <Box
          className="catalogContainer catalogPickerTree"
          style={{
            border: '1px solid var(--mdc-theme-gc-selection-background, #fff)',
            borderRadius: '10px',
          }}
        >
          {!isLoading && (
            <TreeComponent
              treeData={treeData}
              onChange={(newTreeData): void => setTreeData(newTreeData)}
              canDrag={(): boolean => false}
              canDrop={(): boolean => false}
              generateNodeProps={(rowInfo) => ({
                onClick: (): void => handleRowClick(rowInfo),
                className: rowInfo.node.isDisabled ? 'catalogPickerDisabled' : undefined,
                style: rowInfo.node.isGroup ? {} : getTextStyle(rowInfo.node, 'color'),
                icons: rowInfo.node.isGroup
                  ? []
                  : [
                      <ProductTypeRenderer
                        data={rowInfo.node as ILayerImage}
                        thumbnailUrl={getLinkUrlWithToken(rowInfo.node.links, LinkType.THUMBNAIL_S)}
                      />,
                    ],
              })}
            />
          )}
        </Box>
        <Box
          className="catalogPickerDetails"
          style={{
            backgroundColor: theme.custom?.GC_ALTERNATIVE_SURFACE as string,
            border: '1px solid var(--mdc-theme-gc-selection-background, #fff)',
            borderRadius: '10px',
          }}
        >
          <LayersDetailsComponent
            isSearchTab={true}
            className="detailsPanelProductView"
            entityDescriptors={
              store.discreteLayersStore.entityDescriptors as EntityDescriptorModelType[]
            }
            layerRecord={selectedLayer}
            isBrief={true}
            mode={Mode.VIEW}
            intl={intl}
          />
        </Box>
        <Box className="catalogPickerActions">
          <Button raised type="button" disabled={!selectedLayer} onClick={handleSelect}>
            <FormattedMessage id="general.ok-btn.text" />
          </Button>
          <Button type="button" onClick={onClose}>
            <FormattedMessage id="general.cancel-btn.text" />
          </Button>
        </Box>
      </Box>
    );
  }
);
