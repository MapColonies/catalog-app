import React, { useState } from 'react';
import { isEmpty } from 'lodash';
import {
  IconButton,
  MenuSurfaceAnchor,
  MenuSurface,
  Typography,
} from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { IActionGroup, IAction } from '../../../actions/entity.actions';

import './actions.button-renderer.css';

interface IActionsRendererParams {
  actions: IActionGroup[];
  node: Record<string, unknown>;
  entity: string;
  actionHandler: (action: Record<string, unknown>) => void;
}

export const ActionsRenderer: React.FC<IActionsRendererParams> = ({
  node,
  actions,
  entity,
  actionHandler,
}) => {
  let frequentActions: IAction[] = [];
  let allFlatActions: IAction[] = [];

  if (typeof actions !== 'undefined') {
    actions.forEach((actionGroup) => {
      frequentActions = [
        ...frequentActions,
        ...actionGroup.group.filter((action) => action.frequent),
      ];
      allFlatActions = [...allFlatActions, ...actionGroup.group];
    });
  }

  const [openActionsMenu, setOpenActionsMenu] = useState<boolean>(false);

  const sendAction = (
    entity: string,
    action: IAction,
    data: Record<string, unknown>
  ): void => {
    console.log(`SEND ${action.action} EVENT`);
    actionHandler({
      action: `${entity}.${action.action}`,
      data: data,
    });
  };
  return (
    <Box className="actionsContainer">
      {frequentActions.map((action, idx) => {
        return (
          <IconButton
            className={
              action.class
                ? `actionIcon actionDismissible ${action.class}`
                : `actionIcon actionDismissible`
            }
            icon={action.icon}
            key={`freqAct_${node.id as string}_${idx}`}
            onClick={(): void => {
              sendAction(entity, action, node);
            }}
          />
        );
      })}
      <MenuSurfaceAnchor id="actionsMenuContainer">
        <MenuSurface
          open={openActionsMenu}
          onClose={(): void => setOpenActionsMenu(false)}
          onMouseOver={(evt: React.SyntheticEvent<HTMLElement>): void => {
            evt.stopPropagation();
          }}
        >
          {allFlatActions.map((action, idx) => {
            return (
              <Box
                key={`menuAct_${node.id as string}_${idx}`}
                onClick={(evt): void => {
                  sendAction(entity, action, node);
                  setOpenActionsMenu(false);
                }}
                className="actionMenuItem"
              >
                <IconButton
                  className={
                    action.class
                      ? `actionIcon actionDismissible ${action.class}`
                      : `actionIcon actionDismissible`
                  }
                  icon={action.icon}
                />
                <Typography
                  tag="div"
                  className="actionMenuItemTitle actionDismissible"
                >
                  {action.titleTranslationId}
                </Typography>
              </Box>
            );
          })}
        </MenuSurface>
        {!isEmpty(allFlatActions) && (
          <IconButton
            id="allActionsIcon"
            className="actionIcon mc-icon-More"
            onClick={(): void => setOpenActionsMenu(!openActionsMenu)}
          />
        )}
      </MenuSurfaceAnchor>
    </Box>
  );
};
