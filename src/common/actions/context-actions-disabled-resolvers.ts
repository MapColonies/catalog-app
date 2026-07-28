import { get } from 'lodash';
import { hasWFSLink } from '../../discrete-layer/components/helpers/layersUtils';
import { ActionDisabledResolver, ContextActions } from './context.actions';
import { IAction } from './entity.actions';

// Kept out of context.actions.ts to avoid a circular import:
// layersUtils -> discrete-layer/models -> RootStore -> actionDispatcherStore -> context.actions.ts.
const CONTEXT_ACTIONS_DISABLED_RESOLVERS: Partial<Record<ContextActions, ActionDisabledResolver>> =
  {
    [ContextActions.QUERY_POLYGON_PARTS]: ({ payloadData }) => {
      const layerRecord = get(payloadData, 'layerRecord') as Record<string, unknown>;
      return !hasWFSLink(layerRecord);
    },
  };

export const getContextActionDisabledResolver = (
  action: IAction['action']
): ActionDisabledResolver | undefined =>
  CONTEXT_ACTIONS_DISABLED_RESOLVERS[action as ContextActions];
