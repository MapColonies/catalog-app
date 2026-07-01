import { IActionGroup } from '../../../common/actions/entity.actions';

export const disableActionByPredicate = (
  entityPermittedActions: Record<string, unknown>,
  data: Record<string, any>,
  actionToDisable: string,
  predicate: (data: Record<string, unknown>) => boolean
): IActionGroup[] => {
  const actionGroups = (entityPermittedActions[data.__typename] as IActionGroup[]).map((group) => ({
    ...group,
    group: group.group.map((action) => ({ ...action })),
  }));

  if (predicate(data)) {
    const targetGroup = actionGroups.find((group) =>
      group.group.some((action) => action.action === actionToDisable)
    );

    const targetAction = targetGroup?.group.find((action) => action.action === actionToDisable);

    if (targetAction) {
      targetAction.disabled = true;
    }
  }

  return actionGroups;
};
