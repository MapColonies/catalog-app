import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useStore } from '../../discrete-layer/models/RootStore';
import { TabViews } from '../../discrete-layer/views/tab-views';

export const useEntityPermittedActions = (tabView: TabViews): Record<string, unknown> => {
  const intl = useIntl();
  const store = useStore();

  return useMemo(() => {
    const entityActions: Record<string, unknown> = {};
    [
      'LayerRasterRecord',
      'Layer3DRecord',
      'LayerDemRecord',
      'VectorBestRecord',
      'QuantizedMeshBestRecord',
    ].forEach((entityName) => {
      const allGroupsActions = store.actionDispatcherStore.getEntityActionGroups(entityName);
      const permittedGroupsActions = allGroupsActions.map((actionGroup) => {
        return {
          titleTranslationId: actionGroup.titleTranslationId,
          group: actionGroup.group
            .filter((action) => {
              return store.userStore.isActionAllowed(
                `entity_action.${entityName}.${action.action}`
              ) === false
                ? false
                : true && action.views.includes(tabView);
            })
            .map((action) => {
              return {
                ...action,
                title: {
                  ...action.title,
                  translationId: intl.formatMessage({ id: action.title.translationId }),
                },
              };
            }),
        };
      });
      entityActions[entityName] = permittedGroupsActions;
    });
    return entityActions;
  }, [store.userStore.user]);
};
