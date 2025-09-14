import { createActorContext } from "@xstate/react";
import { workflowMachine } from "./state-machine.raster";
import { useStore } from "../../../models";

export const RasterWorkflowContext = createActorContext(workflowMachine);

export function RasterWorkflowProvider({ children }: { children: React.ReactNode }) {
  const store = useStore();

  return (
    <RasterWorkflowContext.Provider options={{ input: { store } }}>
      {children}
    </RasterWorkflowContext.Provider>
  );
}
