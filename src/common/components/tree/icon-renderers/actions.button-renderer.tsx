import React, { useState } from 'react';
import { isEmpty } from 'lodash';
import { IconButton, MenuSurfaceAnchor, MenuSurface, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { IActionGroup, IAction } from '../../../actions/entity.actions';

import './actions.button-renderer.css';

const FIRST = 0;
const EMPTY_ACTION_GROUP = 0;

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

  const sendAction = (entity: string, action: IAction, data: Record<string, unknown>): void => {
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
              action.symbol.class
                ? `actionIcon actionDismissible ${action.symbol.class}`
                : `actionIcon actionDismissible`
            }
            icon={action.symbol.icon}
            disabled={action.disabled}
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
          {actions.map((actionGroup: IActionGroup, groupIdx: number) => {
            return (
              <React.Fragment key={`actGroup_${node.id as string}_${groupIdx}`}>
                {actionGroup.group.length > EMPTY_ACTION_GROUP && groupIdx > FIRST && (
                  <Box
                    key={`menuSeparator_${node.id as string}_${groupIdx}`}
                    className="menuSeparator"
                  ></Box>
                )}
                {actionGroup.group.map((action: IAction, idx: number) => {
                  return (
                    <Box
                      key={`menuAct_${node.id as string}_${groupIdx}_${idx}`}
                      onClick={(evt): void => {
                        if (action.disabled) {
                          evt.preventDefault();
                          evt.stopPropagation();
                          return;
                        }
                        sendAction(entity, action, node);
                        setOpenActionsMenu(false);
                      }}
                      className="actionMenuItem"
                    >
                      <IconButton
                        className={`actionIcon actionDismissible ${action.symbol.class || ''}`}
                        disabled={action.disabled}
                        icon={action.symbol.icon}
                      />
                      <Typography
                        tag="div"
                        disabled={action.disabled}
                        className={`actionMenuItemTitle actionDismissible ${
                          action.disabled ? 'disabled' : ''
                        }
                        ${action.title.class ?? ''}
                        `}
                      >
                        {action.title.translationId}
                      </Typography>
                    </Box>
                  );
                })}
              </React.Fragment>
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
