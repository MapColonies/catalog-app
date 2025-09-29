import { createActorContext } from '@xstate/react';
import { useStore } from '../../../models';
import { workflowMachine } from './state-machine.raster';

export const RasterWorkflowContext = createActorContext(workflowMachine);

export function RasterWorkflowProvider({ children }: { children: React.ReactNode }) {
  const store = useStore();

  return (
    <RasterWorkflowContext.Provider options={{ input: { store } }}>
      {children}
    </RasterWorkflowContext.Provider>
  );
}
