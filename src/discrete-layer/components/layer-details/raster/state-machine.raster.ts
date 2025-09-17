//@ts-nocheck
import path from 'path';
import { createMachine, assign, sendParent, fromPromise } from 'xstate';
import { Mode } from '../../../../common/models/mode.enum';
import { IBaseRootStore, IRootStore, SourceValidationModelType } from '../../../models';

interface IErrorEntry {
  source: "formik" | "api" | "logic";
  code: string;
  message: string;
  level: "error" | "warning";
  field?: string;
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
  // gpkgFile?: File;
  // files?: { product?: File; metadata?: File };
  formData?: Record<string, any>;
  jobId?: string;
  jobStatus?: string;
  autoMode?: boolean;
  // validationResult?: SourceValidationModelType;
  errors: IErrorEntry[];
  store: IRootStore | IBaseRootStore;

  files?: {
    gpkg?: IGPKGFile;
    product?: IProductFile;
    metadata?: IFileBase;
  }
}

type Events =
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
  | { type: "FORMIK_ERROR"; errors: Record<string, string> };

export enum STATE_TAGS {
  GENERAL_LOADING = 'GENERAL_LOADING'
}

// --- Helpers ---
const addError = assign<Context, any>({
  errors: (ctx, e) => [...ctx.errors, e]
});

const warnUnexpectedStateEvent = (_) => {
  console.warn(`[StateMachine] Unexpected event '${_.event.type}' in state '${_.self._snapshot.value}'`);
};

export const hasLoadingTagDeep = (state: State<any, any>, tag? = STATE_TAGS.GENERAL_LOADING): boolean => {
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
      // src: fromPromise(async (ctx: Context) => {
      //   console.log("[verifyGpkgApi] ctx", ctx);
      //   await new Promise((r) => setTimeout(r, 1000));
      //   return { ok: true };
      // }),
      src: fromPromise(async (ctx: Context) => {
        console.log("[verifyGpkgApi] ctx", ctx);

        if (!ctx.input.context.files.gpkg) {
          throw new Error("No file selected");
        };

        // Call into MobX-State-Tree store
        const result = await ctx.input.context.store.queryValidateSource({
          data: {
            fileNames: [path.basename(ctx.input.context.files.gpkg.path)],
            originDirectory: path.dirname(ctx.input.context.files.gpkg.path),
            type: "RECORD_RASTER",
          }
        });

        if (!result.validateSource[0].isValid) {
          throw new Error(result.validateSource[0].message);
        };

        // return whatever you want to flow into `onDone`
        return result;
      }),
      // src: (ctx: Context) => {
      //   console.log('[verifyGpkgApi] ctx', ctx)
      //   return new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 1000));
      //   // if (!ctx.gpkgFile) throw new Error("No file selected");
      //   // if (!ctx.store) throw new Error("Store not provided");

      //   // return ctx.store.queryValidateSource({ fileName: ctx.gpkgFile.name });
      // },
      input: (ctx: Context) => ctx, // pass the current machine context explicitly
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
          sendParent((_, e) => ({
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
    entry: assign({
      errors: (_: Context) => [
        ..._.context.errors,
        {
          source: "api",
          code: "VERIFY_FAILED",
          message: _.event.error.message ?? "Verification failed",
          level: "error"
        }
      ]
    }),
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
      DONE: { actions: sendParent("FLOW_SUBMIT") },
      "*": { actions: warnUnexpectedStateEvent }
    }
  }
};

// --- flow submachine ---
const flowMachine = createMachine<Context, Events>({
  id: "flow",
  initial: "selectGpkg",
  context: (ctx: Context) => ctx.input,

  // context: (ctx: Context) => ({
  //   ...ctx.input
  //   // gpkgFile: undefined,
  //   // files: undefined,
  //   // formData: undefined,
  //   // autoMode: undefined,
  //   // errors: [],
  //   // store: undefined
  // }),
  states: {
    selectGpkg: {
      entry: () => console.log('>>> Enter selectGpkg'),
      on: {
        // SELECT_GPKG: {
        //   target: "verifyGpkg",
        //   actions: assign({ gpkgFile: (_, e) => {
        //     return _.event.file
        //     // return (e as any).file;
        //   }})
        // },
        SELECT_GPKG: {
          target: "verifyGpkg",
          actions: [
            sendParent((_, e) => ({
              type: "SET_GPKG",
              file:  _.event.file
            })),
            assign((_ctx) => ({
              files: {
                ..._ctx.context.files,
                gpkg: {..._ctx.event.file}
              } 
            }))
            // assign({ gpkgFile: (_, e) => {
            //   return _.event.file
            // }})
          ]
        },
        "*": { actions: warnUnexpectedStateEvent }
      }
    },

    verifyGpkg: {
      entry: () => console.log('>>> Enter verifyGpkg parent'),
      type: "compound",
      initial: "verifying",
      states: verifyGpkgStates,
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
        SUBMIT: sendParent("FLOW_SUBMIT"),
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
export const workflowMachine = createMachine<Context, Events>({
  id: "workflow",
  initial: "idle",
  context: ({ input }) => ({
    //store: input.store,
    ...input,
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
    // flow: {
    //   // type: "compound",
    //   // initial: "selectGpkg",
    //   // states: {
    //   //   ...flowMachine.config.states // spread the states here
    //   // },
    //   id: "flow",
    //   type: "machine",
    //   // initial: "selectGpkg",
    //   machine: flowMachine,
    //   on: {
    //     FLOW_ERROR: { target: "error", actions: assign({ errors: (ctx, e: any) => [...ctx.errors, e.error] }) },
    //     FLOW_SUBMIT: "jobSubmission"
    //   }
    // },
    flow: {
      entry: () => console.log('>>> Entering flow state'),
      invoke: {
        id: "flow",              // child actor name
        src: flowMachine,        // reference to your submachine
        input: (ctx: Context) => {
          console.log('[flowMachine share context by data]', ctx)
          return ctx.context//{context:ctx};
        },
        sync: true
      },
      on: {
        SET_GPKG: {
          // actions: assign({
          //   gpkgFile: (_) => {
          //     return _.event.file;
          //   }
          // })
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
        FLOW_ERROR: { target: "error", actions: assign({ errors: (ctx, e: any) => [...ctx.errors, e.error] }) },
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
