//@ts-nocheck
import path from 'path';
import {
  // ActionArgs,
  assign,
  createMachine,
  EventObject,
  fromPromise,
  PromiseActorRef,
  sendParent,
  SnapshotFrom
} from 'xstate';
import { Mode } from '../../../../common/models/mode.enum';
import { IBaseRootStore, IRootStore, RecordType, SourceValidationModelType } from '../../../models';
import { AnyActorSystem } from 'xstate/dist/declarations/src/system';

interface IErrorEntry {
  source: "formik" | "api" | "logic";
  code: string;
  message: string;
  level: "error" | "warning";
  field?: string;
  addPolicy?: "merge" | "override";
  response?: Record<string,unknown>;
}

interface IFileDetails {
  updateDate: Date;
  size: number;
}

interface IFileBase {
  path: string;
  details: IFileDetails;
  exists: boolean;
}

interface IGPKGFile extends IFileBase {
  validationResult?: SourceValidationModelType;
}

interface IProductFile extends IFileBase {
  data: File;
}

interface Context {
  flowType?: Mode.NEW | Mode.UPDATE;
  formData?: Record<string, any>;
  jobId?: string;
  jobStatus?: string;
  autoMode?: boolean;
  errors: IErrorEntry[];
  store: IRootStore | IBaseRootStore;
  files?: {
    gpkg?: IGPKGFile;
    product?: IProductFile;
    metadata?: IFileBase;
  }
}

export type Events =
  | { type: "START_NEW" }
  | { type: "START_UPDATE" }
  | { type: "RESTORE"; jobId: string }
  | { type: "SELECT_GPKG"; file: IGPKGFile }
  | { type: "SET_GPKG"; file: IGPKGFile }
  | { type: "SET_GPKG_VALIDATION"; res: SourceValidationModelType }
  | { type: "AUTO" }
  | { type: "MANUAL" }
  | { type: "SELECT_PRODUCT"; file: File }
  | { type: "SELECT_METADATA"; file: File }
  | { type: "DONE" }
  | { type: "UPDATE_FORM"; data: Record<string, any> }
  | { type: "SUBMIT" }
  | { type: "RETRY" }
  | { type: "FORMIK_ERROR"; errors: Record<string, string> }
  | { type: "FLOW_ERROR"; error: IErrorEntry };


// type FlowActionArgs = ActionArgs<Context, Events, Events>;

type FromPromiseArgs<TInput> = {
  input: {
    context: TInput;
  };
  system: AnyActorSystem;
  self: PromiseActorRef<any>;
  signal: AbortSignal;
  emit: (emitted: EventObject) => void;
};

export enum STATE_TAGS {
  GENERAL_LOADING = 'GENERAL_LOADING'
}

// --- Helpers ---
const addError = assign({
  errors: (ctx: Context, e) => [...ctx.errors, e]
});

const warnUnexpectedStateEvent = (_: any) => {
  //@ts-ignore
  console.warn(`[StateMachine] Unexpected event '${_.event.type}' in state '${_.self._snapshot.value}'`);
};

export const hasLoadingTagDeep = (state: SnapshotFrom<typeof workflowMachine>, tag = STATE_TAGS.GENERAL_LOADING): boolean => {
  // check current state tags
  if (state.hasTag(tag)) return true;

  // check all children recursively
  for (const child of Object.values(state.children)) {
    const childSnap = child.getSnapshot?.();
    if (childSnap && hasLoadingTagDeep(childSnap)) {
      return true;
    }
  }

  return false;
}

// --- verifyGpkg states ---
const verifyGpkgStates = {
  verifying: {
    entry: (ctx: Context) => console.log(">>> verifying entry", ctx),
    tags: [STATE_TAGS.GENERAL_LOADING],
    invoke: {
      id: "verifyGpkgApi",
      src: fromPromise(async ({ input }: FromPromiseArgs<Context>) => {
        console.log("[verifyGpkgApi] ctx.input", input);

        if (!input.context.files?.gpkg) {
          throw new Error("No file selected");
        };

        // Call into MobX-State-Tree store
        const result = await input.context.store.queryValidateSource({
          data: {
            fileNames: [path.basename(input.context.files.gpkg.path)],
            originDirectory: path.dirname(input.context.files.gpkg.path),
            type: RecordType.RECORD_RASTER,
          }
        });

        if (!result.validateSource[0].isValid) {
          throw new Error(result.validateSource[0].message as string);
        };

        // return whatever you want to flow into `onDone`
        return result;
      }),
      input: (ctx: Context) => ctx, 
      onDone: { 
        target: "success",
        actions: [
          assign({
            files: (_) => ({
              ..._.context.files,
              gpkg: {
                ..._.context.files.gpkg,
                validationResult: {..._.event.output.validateSource[0]}
              }
            })
          }),
          sendParent((_: { context: Context; event: any }) => ({
            type: "SET_GPKG_VALIDATION",
            res:  _.event.output.validateSource[0]
          }))
        ]
      },
      onError: { target: "failure" }
    }
  },

  success: {
    type: "final"
  },

  failure: {
    entry: 
      sendParent((_: { context: Context; event: any }) => ({
        type: "FLOW_ERROR",
        error:  {
          source: "api",
          code: "ingestion.error.invalid-source-file",
          message: 'string',
          response: _.event.error.response,
          level: "error",
          addPolicy: "override"
        }
      })),
    type: "final"
  }
};
// --- reusable file selection states ---
const fileSelectionStates = {
  idle: {},
  auto: {
    invoke: {
      src: "checkNamingConvention",
      input: (ctx: Context) => ctx.files?.gpkg,
      onDone: [
        {
          target: "idle",
          guard: (_, e) => e.data.product && e.data.metadata,
          actions: assign({ files: (_, e) => e.data })
        }
      ],
      onError: {
        actions: sendParent((ctx, e) => ({
          type: "FLOW_ERROR",
          error: e.data ?? e
        }))
      }
    }
  },
  manual: {
    entry: assign((ctx: Context) => (ctx.files ? { files: ctx.files } : {})),
    always: { target: "idle" }, // you can add guard if needed
    on: {
      SELECT_PRODUCT: { actions: assign({ files: (ctx: Context, e) => ({ ...ctx.files, product: (e as any).file }) }) },
      SELECT_METADATA: { actions: assign({ files: (ctx: Context, e) => ({ ...ctx.files, metadata: (e as any).file }) }) },
      DONE: { 
        actions: sendParent((ctx, e) => ({
          type: "FLOW_SUBMIT",
          error: e.data ?? e
        })) 
      },
      "*": { actions: warnUnexpectedStateEvent }
    }
  }
};

// --- flow submachine ---
const flowMachine = createMachine({
  id: "flow",
  initial: "selectGpkg",
  context: (ctx: any) => ctx.input,
  states: {
    selectGpkg: {
      entry: () => console.log('>>> Enter selectGpkg'),
      on: {
        SELECT_GPKG: {
          target: "verifyGpkg",
          actions: [
            sendParent((_: { context: Context; event: any }) => ({
              type: "SET_GPKG",
              file:  _.event.file
            })),
            assign((_ctx) => ({
              files: {
                ..._ctx.context.files,
                gpkg: {..._ctx.event.file}
              } 
            }))
          ]
        },
        "*": { actions: warnUnexpectedStateEvent }
      }
    },

    verifyGpkg: {
      entry: () => console.log('>>> Enter verifyGpkg parent'),
      type: "compound",
      initial: "verifying",
      states: verifyGpkgStates as any,
      // onDone: "modeSelection"
    },

    modeSelection: {
      entry: () => console.log('>>> Enter modeSelection parent'),
      type: "compound",
      initial: "idle",
      states: fileSelectionStates,
      on: {
        AUTO: ".auto",
        MANUAL: ".manual",
        "*": { actions: warnUnexpectedStateEvent }
      }
    },

    mapPreview: {
      invoke: {
        src: "downloadAndRenderProduct",
        input: (ctx: Context) => ctx.files?.product,
        onDone: "formFill",
        onError: {
          target: "error",
          actions: addError
        }
      }
    },

    formFill: {
      entry: assign((ctx: Context) => ({
        formData: ctx.formData ?? {}
      })),
      on: {
        UPDATE_FORM: {
          actions: assign({
            formData: (_, e) => (e as any).data
          })
        },
        FORMIK_ERROR: {
          actions: assign((ctx: Context, e: any) => ({
            errors: [
              ...ctx.errors,
              ...Object.entries(e.errors).map(([field, msg]) => ({
                source: "formik",
                code: `FIELD_${field}`,
                message: msg as string,
                level: "error",
                field
              }))
            ]
          }))
        },
        SUBMIT: {
          actions: sendParent({type: "FLOW_SUBMIT"}),
        },
        "*": { actions: warnUnexpectedStateEvent }
      }
    },

    // parent-level error (instead of child jumping out)
    error: {
      type: "atomic",
      on: {
        RETRY: "selectGpkg" // example recovery path
      }
    }
  }
});

// --- parent workflow machine ---
export const workflowMachine = createMachine({
  id: "workflow",
  initial: "idle",
  context: ({ input }) => ({
    ...input as Context,
    errors: []
  }),
  states: {
    idle: {
      on: {
        START_NEW: { target: "flow", actions: assign({ flowType: Mode.NEW }) },
        START_UPDATE: { target: "flow", actions: assign({ flowType: Mode.UPDATE }) },
        RESTORE: "restoreJob",
        "*": { actions: warnUnexpectedStateEvent }
      }
    },
    restoreJob: {
      invoke: {
        src: "fetchJobData",
        input: (_ctx: Context, e) => (e as any).jobId,
        onDone: {
          target: "restoredReplay",
          actions: assign((_, e) => ({
            flowType: e.data.flowType,
            gpkgFile: e.data.gpkg,
            files: e.data.files,
            formData: e.data.formData,
            autoMode: e.data.autoMode
          }))
        },
        onError: { target: "#workflow.error", actions: addError }
      }
    },
    restoredReplay: { always: "flow" },
    flow: {
      entry: () => console.log('>>> Entering flow state'),
      invoke: {
        id: "flow",              // child actor name
        src: flowMachine,        // reference to your submachine
        input: (ctx: Context) => {
          console.log('[flowMachine share context by data]', ctx)
          return (ctx as any).context;
        },
        // sync: true
      },
      on: {
        SET_GPKG: {
          actions: assign((_ctx) => ({
            files: {
              ..._ctx.context.files,
              gpkg: {..._ctx.event.file}
            } 
          }))
        },
        SET_GPKG_VALIDATION: {
          actions: assign({
            files: (_) => ({
              ..._.context.files,
              gpkg: {
                ..._.context.files.gpkg,
                validationResult: {..._.event.res}
              }
            })
          })
        },        
        FLOW_ERROR: { 
          // target: "error",
          actions: assign({ 
            errors: (_) => {
              return _.event.error.addPolicy === "merge" ? 
                [ ..._.context.errors, _.event.error] : 
                [_.event.error]
            }
          }) 
        },
        FLOW_SUBMIT: "jobSubmission"
      }
    },
    jobSubmission: {
      invoke: {
        src: "createJobApi",
        input: (ctx: Context) => ({ files: ctx.files, formData: ctx.formData, flowType: ctx.flowType }),
        onDone: { target: "jobPolling", actions: assign({ jobId: (_, e) => e.data.jobId }) },
        onError: { target: "#workflow.error", actions: addError }
      }
    },
    jobPolling: {
      invoke: {
        src: "pollJobStatus",
        input: (ctx: Context) => ctx.jobId,
        onDone: { target: "done", actions: assign({ jobStatus: (_, e) => e.data }) },
        onError: { target: "#workflow.error", actions: addError }
      }
    },
    done: { type: "final" },
    error: {
      on: {
        RETRY: "idle",
        "*": { actions: warnUnexpectedStateEvent }
      }
    }
  },
  // on: {
  //   FLOW_ERROR: { target: "#workflow.error", actions: addError },
  //   FLOW_SUBMIT: { target: "#workflow.jobSubmission" }
  // }
});
