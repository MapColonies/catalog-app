/* eslint-disable */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getDescendantCount, getDepth } from 'react-sortable-tree';
import { Tooltip } from '@map-colonies/react-core';
import './node-content-renderer.css';
import TooltippedValue from '../../form/tooltipped.value';

function isDescendant(older, younger) {
  return (
    !!older.children &&
    typeof older.children !== 'function' &&
    older.children.some(
      (child) => child === younger || isDescendant(child, younger)
    )
  );
}

// eslint-disable-next-line react/prefer-stateless-function
class FileThemeNodeContentRenderer extends Component {
  render() {
    const {
      scaffoldBlockPxWidth,
      toggleChildrenVisibility,
      connectDragPreview,
      connectDragSource,
      isDragging,
      canDrop,
      canDrag,
      node,
      title,
      draggedNode,
      path,
      treeIndex,
      isSearchMatch,
      isSearchFocus,
      icons,
      buttons,
      className,
      style,
      didDrop,
      lowerSiblingCounts,
      listIndex,
      swapFrom,
      swapLength,
      swapDepth,
      treeId, // Not needed, but preserved for other renderers
      isOver, // Not needed, but preserved for other renderers
      parentNode, // Needed for dndManager
      rowDirection,
      ...otherProps
    } = this.props;
    const nodeTitle = title || node.title;
    const tooltipText =
      typeof nodeTitle === 'function'
        ? nodeTitle({
            node,
            path,
            treeIndex,
          })
        : nodeTitle;

    const styles = {
      lineBlock: 'lineBlock',
      highlightBottomLeftCorner: 'highlightBottomLeftCorner',
      highlightTopLeftCorner: 'highlightTopLeftCorner',
      highlightLineVertical: 'highlightLineVertical',
      absoluteLineBlock: 'absoluteLineBlock',
      rowWrapper: 'rowWrapper',
      rowWrapperDragDisabled: 'rowWrapperDragDisabled',
      row: 'row',
      rowLandingPad: 'rowLandingPad',
      rowCancelPad: 'rowCancelPad',
      rowSearchMatch: 'rowSearchMatch',
      rowSearchFocus: 'rowSearchFocus',
      rowContents: 'rowContents',
      rowContentsDragDisabled: 'rowContentsDragDisabled',
      rowToolbar: 'rowToolbar',
      toolbarButton: 'toolbarButton',
      rowLabel: 'rowLabel',
      rowTitle: 'rowTitle',
      collapseButton: 'collapseButton',
      expandButton: 'expandButton',
    };

    const isDraggedDescendant = draggedNode && isDescendant(draggedNode, node);
    const isLandingPadActive = !didDrop && isDragging;
    const isSecondLevelLeaf = node.isGroup === undefined && path.length === 2;

    // Construct the scaffold representing the structure of the tree
    const scaffold = [];
    lowerSiblingCounts.forEach((lowerSiblingCount, i) => {
      if (!isSecondLevelLeaf) {
        scaffold.push(
          <div
            key={`pre_${1 + i}`}
            style={{ width: scaffoldBlockPxWidth }}
            className={styles.lineBlock}
          />
        );
      }

      if (treeIndex !== listIndex && i === swapDepth) {
        // This row has been shifted, and is at the depth of
        // the line pointing to the new destination
        let highlightLineClass = '';

        if (listIndex === swapFrom + swapLength - 1) {
          // This block is on the bottom (target) line
          // This block points at the target block (where the row will go when released)
          highlightLineClass = styles.highlightBottomLeftCorner;
        } else if (treeIndex === swapFrom) {
          // This block is on the top (source) line
          highlightLineClass = styles.highlightTopLeftCorner;
        } else {
          // This block is between the bottom and top
          highlightLineClass = styles.highlightLineVertical;
        }

        scaffold.push(
          <div
            key={`highlight_${1 + i}`}
            style={{
              width: scaffoldBlockPxWidth,
              left: scaffoldBlockPxWidth * i,
            }}
            className={`${styles.absoluteLineBlock} ${highlightLineClass}`}
          />
        );
      }
    });

    const nodeContent = (
      <div style={{ height: '100%' }} {...otherProps}>
        {toggleChildrenVisibility &&
          node.children &&
          node.children.length > 0 && (
            <button
              type="button"
              aria-label={node.expanded ? 'Collapse' : 'Expand'}
              className={
                node.expanded ? styles.collapseButton : styles.expandButton
              }
              style={{
                left:
                  rowDirection === 'ltr'
                    ? (lowerSiblingCounts.length - 0.4) * scaffoldBlockPxWidth
                    : 'unset',
                right:
                  rowDirection === 'rtl'
                    ? parentNode === null
                      ? -1 * lowerSiblingCounts.length * scaffoldBlockPxWidth
                      : 'unset'
                    : 'unset',
              }}
              onClick={() =>
                toggleChildrenVisibility({
                  node,
                  path,
                  treeIndex,
                })
              }
            />
          )}

        <div
          className={
            styles.rowWrapper +
            (!canDrag ? ` ${styles.rowWrapperDragDisabled}` : '') +
            (node.isSelected ? ` rowSelected` : '')
          }
          style={{
            position: 'absolute',
            left:
              rowDirection === 'ltr' && !isSecondLevelLeaf
                ? scaffoldBlockPxWidth
                : 'unset',
            right: rowDirection === 'rtl' ? scaffoldBlockPxWidth * 2 : 'unset',
            width: 'calc(100% - var(--rst-expander-size))',
          }}
        >
          {/* Set the row preview to be used during drag and drop */}
          {connectDragPreview(
            <div style={{ display: 'flex', width: '100%' }}>
              {scaffold}
              <div
                className={
                  styles.row +
                  (isLandingPadActive ? ` ${styles.rowLandingPad}` : '') +
                  (isLandingPadActive && !canDrop
                    ? ` ${styles.rowCancelPad}`
                    : '') +
                  (isSearchMatch ? ` ${styles.rowSearchMatch}` : '') +
                  (isSearchFocus ? ` ${styles.rowSearchFocus}` : '') +
                  (className ? ` ${className}` : '')
                }
                style={{
                  opacity: isDraggedDescendant ? 0.5 : 1,
                  flex: 1,
                  ...style,
                }}
              >
                <div
                  className={
                    styles.rowContents +
                    (!canDrag ? ` ${styles.rowContentsDragDisabled}` : '')
                  }
                >
                  <div className={styles.rowToolbar}>
                    {icons.map((icon, index) => (
                      <div
                        key={`${node.id}_${index}`}
                        className={styles.toolbarButton}
                      >
                        {icon}
                      </div>
                    ))}
                  </div>

                  <TooltippedValue
                    dir=""
                    className={styles.rowLabel}
                    tag={'div'}
                    customTooltipText={tooltipText}
                  >
                    <span className={styles.rowTitle}>{tooltipText}</span>
                  </TooltippedValue>

                  {!node.children && (
                    <div className={styles.rowToolbar}>
                      {buttons.map((btn, index) => (
                        <div
                          key={index} // eslint-disable-line react/no-array-index-key
                          className={styles.toolbarButton}
                        >
                          {btn}
                        </div>
                      ))}
                    </div>
                  )}

                  {node.children && (
                    <div className="descendantCount">
                      ({' '}
                      {getDescendantCount({ node, ignoreCollapsed: false }) -
                        (parentNode !== null
                          ? 0
                          : getDepth(node) > 1
                          ? node.children.length
                          : 0)}{' '}
                      )
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );

    return canDrag
      ? connectDragSource(nodeContent, { dropEffect: 'copy' })
      : nodeContent;
  }
}

FileThemeNodeContentRenderer.defaultProps = {
  buttons: [],
  canDrag: false,
  canDrop: false,
  className: '',
  draggedNode: null,
  icons: [],
  isSearchFocus: false,
  isSearchMatch: false,
  parentNode: null,
  style: {},
  swapDepth: null,
  swapFrom: null,
  swapLength: null,
  title: null,
  toggleChildrenVisibility: null,
};

FileThemeNodeContentRenderer.propTypes = {
  buttons: PropTypes.arrayOf(PropTypes.node),
  canDrag: PropTypes.bool,
  className: PropTypes.string,
  icons: PropTypes.arrayOf(PropTypes.node),
  isSearchFocus: PropTypes.bool,
  isSearchMatch: PropTypes.bool,
  listIndex: PropTypes.number.isRequired,
  lowerSiblingCounts: PropTypes.arrayOf(PropTypes.number).isRequired,
  node: PropTypes.shape({}).isRequired,
  path: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ).isRequired,
  scaffoldBlockPxWidth: PropTypes.number.isRequired,
  style: PropTypes.shape({}),
  swapDepth: PropTypes.number,
  swapFrom: PropTypes.number,
  swapLength: PropTypes.number,
  title: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  toggleChildrenVisibility: PropTypes.func,
  treeIndex: PropTypes.number.isRequired,
  treeId: PropTypes.string.isRequired,
  rowDirection: PropTypes.string.isRequired,

  // Drag and drop API functions
  // Drag source
  connectDragPreview: PropTypes.func.isRequired,
  connectDragSource: PropTypes.func.isRequired,
  didDrop: PropTypes.bool.isRequired,
  draggedNode: PropTypes.shape({}),
  isDragging: PropTypes.bool.isRequired,
  parentNode: PropTypes.shape({}), // Needed for dndManager
  // Drop target
  canDrop: PropTypes.bool,
  isOver: PropTypes.bool.isRequired,
};

export default FileThemeNodeContentRenderer;
