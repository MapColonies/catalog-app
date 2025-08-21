import React, { useMemo, useState } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { get, isEmpty } from 'lodash';
import { IconButton, MenuSurfaceAnchor, Typography, Menu, MenuItem } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { IActionGroup, IAction, isDependentFieldWithValue } from '../../../actions/entity.actions';

import './actions.cell-renderer.css';

const FIRST = 0;
const EMPTY_ACTION_GROUP = 0;

interface IActionsRendererParams extends ICellRendererParams {
  actions: Record<string,IActionGroup[]>;
  actionHandler: (action: Record<string,unknown>) => void;
}

export const ActionsRenderer: React.FC<IActionsRendererParams> = (props) => {
  const entity = (props.data as Record<string,unknown>).__typename as string;

  const filterActionsByDependentFields = (actions: IActionGroup[]): IActionGroup[] => {
    const data = (props.data as Record<string,unknown>);
    const filteredActionGroups = actions.map(actionGroup => {
      return ({
        ...actionGroup,
        group: actionGroup.group.filter(action => {
          const { dependentField } = action;
          if (typeof dependentField === 'undefined') return true;
          
          if (isDependentFieldWithValue(dependentField)) {
            if (!(dependentField.field in data)) return true;
            return get(data, dependentField.field) === dependentField.expectedValue;
          }
                    
          return get(data, dependentField) as boolean;
        })
      })
    });

    return filteredActionGroups;
  };

  const actions = useMemo(() => filterActionsByDependentFields(props.actions[entity]), [props.actions[entity]]);
  let frequentActions: IAction[] = [];
  let allFlatActions: IAction[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (actions !== undefined) {
    actions.forEach(actionGroup => {
      frequentActions = [
        ...frequentActions,
        ...actionGroup.group.filter(action => action.frequent)
      ];
      allFlatActions = [
        ...allFlatActions,
        ...actionGroup.group
      ];
    });
  }

  const [openActionsMenu, setOpenActionsMenu] = useState<boolean>(false);

  const sendAction = (entity: string, action: IAction, data: Record<string,unknown>): void => {
    console.log(`SEND for ${entity} ${action.action} EVENT`);
    props.actionHandler({
      action: `${entity}.${action.action}`,
      data: data,
    });
  };

  return (
    <Box id="gridActionsCellRenderer" className="actionsContainer">
      {
        frequentActions.map((action, idx) => {
          return (
            <IconButton
              className={action.class ? `actionIcon actionDismissible ${action.class}` : `actionIcon actionDismissible`}
              icon={action.icon}
              key={`freqAct_${action.action}_${idx}`}
              onClick={(): void => { 
                sendAction(entity, action, props.data);
              }}
            />
          );
        })
      }
      <MenuSurfaceAnchor id="gridActionsMenuContainer">
        <Menu
          open={openActionsMenu}
          onClose={(): void => setOpenActionsMenu(false)}
          onMouseOver={(evt: React.MouseEvent): void => evt.stopPropagation()}
        >
          {
            actions.map((actionGroup: IActionGroup, groupIdx: number) => {
              return (
                <React.Fragment key={`actGroup_${groupIdx}`}>
                  {actionGroup.group.length > EMPTY_ACTION_GROUP && groupIdx > FIRST && 
                    <MenuItem key={`menuItemSeparator_groupId_${groupIdx}`}>
                      <Box className="menuSeparator"></Box>
                    </MenuItem>
                  }
                  {actionGroup.group.map((action: IAction, idx: number) => {
                    return (
                      <MenuItem
                        className="actionMenuItemContainer"
                        onClick={(evt): void => {
                          sendAction(entity, action, props.data);
                          setOpenActionsMenu(false); 
                        }}
                        key={`menuItemAct_${action.action}_${idx}`}>
                        <Box 
                          className="actionMenuItem"
                        >
                          <IconButton
                            className={action.class ? `actionIcon actionDismissible ${action.class}` : `actionIcon actionDismissible glow-missing-icon`}
                            icon={action.icon}
                          />
                          <Typography 
                            tag="div"
                            className="actionMenuItemTitle actionDismissible"
                          >
                            {action.titleTranslationId}
                          </Typography>
                        </Box>
                      </MenuItem>
                    );
                  })}
                </React.Fragment>
              )
            })
          }
        </Menu>
        {
          !isEmpty(allFlatActions) &&
          <IconButton 
            id="allActionsIcon"
            className="actionIcon mc-icon-More"
            onClick={(): void => setOpenActionsMenu(!openActionsMenu)}
          />
        }
      </MenuSurfaceAnchor>
    </Box>
  );
};
