import { IActionGroup } from '../actions/entity.actions';

const FIRST = 0;
const EMPTY_ACTION_GROUP = 0;

export const shouldRenderSeparator = (actionGroup: IActionGroup, groupIdx: number): boolean => {
  return actionGroup.group.length > EMPTY_ACTION_GROUP && groupIdx > FIRST;
};
