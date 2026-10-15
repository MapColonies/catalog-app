import { changeNodeAtPath, ExtendedNodeData, map } from 'react-sortable-tree';
import { TreeItem } from './tree';

const keyFromTreeIndex = ({ treeIndex }: { treeIndex: number }): number => treeIndex;

export const toggleTreeSelection = (
  treeData: TreeItem[],
  rowInfo: ExtendedNodeData,
  multiSelection: boolean = false
): TreeItem[] => {
  const nextTreeData = multiSelection
    ? treeData
    : (map({
        treeData,
        getNodeKey: keyFromTreeIndex,
        callback: ({ node }: { node: TreeItem }) =>
          node.isSelected ? { ...node, isSelected: false } : node,
      }) as TreeItem[]);

  return changeNodeAtPath({
    treeData: nextTreeData,
    path: rowInfo.path,
    getNodeKey: keyFromTreeIndex,
    newNode: { ...rowInfo.node, isSelected: !rowInfo.node.isSelected },
  });
};
