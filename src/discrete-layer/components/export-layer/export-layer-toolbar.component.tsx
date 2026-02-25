import React, { useMemo, useState } from 'react';
import { Box } from '@map-colonies/react-components';
import { observer } from 'mobx-react-lite';
import {
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  MenuSurfaceAnchor,
  Tooltip,
  Typography,
} from '@map-colonies/react-core';
import { useIntl } from 'react-intl';
import { FeatureCollection, lineString } from '@turf/helpers';
import { Feature, Point } from 'geojson';
import { get, isEmpty } from 'lodash';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import { IDispatchAction } from '../../models/actionDispatcherStore';
import { useStore } from '../../models';
import { BBoxDialog } from '../map-container/bbox.dialog';
import useDomainExportActionsConfig, {
  ExportAction,
} from './hooks/useDomainExportActionsConfig';

interface ExportLayerToolbarProps {
  disableAll?: boolean;
}
interface ActionPresentorBaseProps {
  action: ExportAction;
  listKey: string;
  dispatchAction: (action: Record<string, unknown>) => void;
  data?: Record<string, unknown>;
}

const MenuActionPresentor: React.FC<ActionPresentorBaseProps> = ({
  action,
  listKey,
  dispatchAction,
}) => {
  const intl = useIntl();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  if (action === 'SEPARATOR' || isEmpty(action.menuActionOptions?.items))
    return null;

  return (
    <>
      {typeof action.menuActionOptions !== 'undefined' && (
        <MenuSurfaceAnchor key={listKey}>
          <Menu
            className="exportActionMenu"
            anchorCorner={'bottomStart'}
            open={isActionMenuOpen}
            onClose={(): void => setIsActionMenuOpen(false)}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            onMouseOver={(evt: MouseEvent): void => evt.stopPropagation()}
          >
            {Array.from(action.menuActionOptions.items).map(
              ([actionKey, value], i) => {
                return (
                  <MenuItem
                    key={`action_${actionKey}_${i}`}
                    onClick={(): void => {
                      const actionToDispatch = {
                        ...action.menuActionOptions?.dispatchOnItemClick,
                        data: value as Feature,
                      };

                      dispatchAction(actionToDispatch);
                    }}
                  >
                    <Box className="exportActionMenuItem">
                      <Typography tag="p">{actionKey}</Typography>
                    </Box>
                  </MenuItem>
                );
              }
            )}
          </Menu>
          <Tooltip
            content={intl.formatMessage({ id: action.titleTranslationId })}
          >
            <IconButton
              className={`exportAction ${action.disabled ? 'disabled' : ''} ${
                action.class
              }`}
              id="exportMenuActionIcon"
              onClick={(): void =>
                setIsActionMenuOpen((isMenuOpen) => !isMenuOpen)
              }
              disabled={action.disabled}
            />
          </Tooltip>
        </MenuSurfaceAnchor>
      )}
    </>
  );
};

const ToggleActionPresentor: React.FC<ActionPresentorBaseProps> = ({
  action,
  listKey,
  data = {},
  dispatchAction,
}) => {
  const intl = useIntl();
  const store = useStore();

  if (
    action === 'SEPARATOR' ||
    typeof action.toggleExportStoreFieldOptions === 'undefined'
  )
    return null;

  const toggleOptions = action.toggleExportStoreFieldOptions;
  const isChecked = get(store.exportStore, toggleOptions.field) as boolean;
  const checkboxLabel = isChecked
    ? intl.formatMessage({ id: toggleOptions.labelChecked })
    : intl.formatMessage({ id: toggleOptions.labelUnchecked });

  return (
    <Checkbox
      checked={isChecked}
      onClick={(): void => dispatchAction({ action: action.action, data })}
      label={checkboxLabel}
      className={`exportAction exportToggle ${
        action.disabled ? 'disabled' : ''
      } ${action.class}`}
      key={listKey}
      disabled={action.disabled}
    />
  );
};

const ActionPresentor: React.FC<ActionPresentorBaseProps> = (props) => {
  const { action, listKey, data, dispatchAction } = props;
  const intl = useIntl();

  const getActionPresentorByProps = useMemo(() => {
    if (action === 'SEPARATOR') {
      return <Box className="exportActionSeparator"></Box>;
    }

    const shouldRenderToggle =
      typeof action.toggleExportStoreFieldOptions !== 'undefined';
    const shouldRenderMenu = typeof action.menuActionOptions !== 'undefined';

    let presentor: JSX.Element;

    switch (true) {
      case shouldRenderToggle:
        presentor = <ToggleActionPresentor {...props} />;
        break;
      case shouldRenderMenu:
        presentor = <MenuActionPresentor {...props} />;
        break;
      default:
        presentor = (
          <IconButton
            className={`exportAction ${action.disabled ? 'disabled' : ''} ${
              action.class
            }`}
            key={listKey}
            label={action.action}
            disabled={action.disabled}
            onClick={(): void =>
              dispatchAction({ action: action.action, data })
            }
          />
        );

        break;
    }

    return (
      <Tooltip content={intl.formatMessage({ id: action.titleTranslationId })}>
        {presentor}
      </Tooltip>
    );
  }, [action]);

  return getActionPresentorByProps;
};

const ExportLayerToolbar: React.FC<ExportLayerToolbarProps> = observer(
  ({ disableAll }) => {
    const store = useStore();
    const exportStore = store.exportStore;
    const exportActions = useDomainExportActionsConfig();

    const dispatchAction = (action: Record<string, unknown>): void => {
      store.actionDispatcherStore.dispatchAction({
        action: action.action,
        data: action.data,
      } as IDispatchAction);
    };

    return (
      <Box className="exportToolbarContainer">
        {exportActions.map((action, i) => {
          const actionToDisplay =
            action === 'SEPARATOR'
              ? action
              : {
                  ...action,
                  disabled: (disableAll as boolean) || action.disabled,
                };

          return (
            <ActionPresentor
              key={`action_${i}`}
              dispatchAction={dispatchAction}
              action={actionToDisplay}
              listKey={i.toString()}
            />
          );
        })}

        <BBoxDialog
          isOpen={exportStore.isBBoxDialogOpen as boolean}
          onSetOpen={exportStore.setIsBBoxDialogOpen}
          onPolygonUpdate={(selection): void => {
            const lineStr = lineString(
              (selection.geojson as FeatureCollection).features.map(
                (feature) => (feature.geometry as Point).coordinates
              )
            );
            const lineStrBBox = bbox(lineStr);
            const selectionPolygon = bboxPolygon(lineStrBBox);
            exportStore.setTempRawSelection(selectionPolygon);
          }}
        />
      </Box>
    );
  }
);

export default ExportLayerToolbar;
