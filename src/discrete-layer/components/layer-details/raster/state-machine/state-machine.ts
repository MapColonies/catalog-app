import { merge } from 'lodash';
import { assign, createMachine, sendParent } from 'xstate';
import { Mode } from '../../../../../common/models/mode.enum';
import CONFIG from '../../../../../common/config';
import { Status } from '../../../../models';
import {
  fetchProductActions,
  filesErrorActions,
  filesSelectedActions,
  selectFileActions,
  selectionModeActions
} from './action-handlers';
import {
  addError,
  warnUnexpectedStateEvent
} from './helpers';
import { SERVICES } from './services';
import {
  GPKG_LABEL,
  IContext,
  METADATA_LABEL,
  PRODUCT_LABEL,
  STATE_TAGS,
  WORKFLOW
} from './types';

//#region --- FILES sub state machine ---
const filesMachine = createMachine({
  id: WORKFLOW.FILES.ROOT,
  initial: WORKFLOW.FILES.SELECTION_MODE,
  context: (ctx: any) => ctx.input,
  states: {
    [WORKFLOW.FILES.SELECTION_MODE]: {
      always: [
        {
          guard: (_: { context: IContext }) => {
            return _.context.selectionMode === 'manual';
          },
          target: WORKFLOW.FILES.MANUAL.ROOT
        },
        {
          target: WORKFLOW.FILES.AUTO.ROOT
        }
      ]
    },
    [WORKFLOW.FILES.AUTO.ROOT]: {
      entry: (_: { context: IContext; event: any }) => console.log(`>>> ${WORKFLOW.FILES.AUTO.ROOT}`, _),
      initial: WORKFLOW.FILES.AUTO.IDLE,
      states: {
        [WORKFLOW.FILES.AUTO.IDLE]: {
          entry: () => console.log(`>>> Enter ${WORKFLOW.FILES.AUTO.ROOT.toUpperCase()}.${WORKFLOW.FILES.AUTO.IDLE}`),
          on: {
            SELECT_FILES: {
              actions: [
                ...selectFileActions('gpkg', 'override', false),
                sendParent({ type: "CLEAN_ERRORS" })
              ],
              target: WORKFLOW.FILES.AUTO.SELECT_FILES
            },
            MANUAL: {
              actions: [
                ...selectionModeActions('manual' as SelectionMode, {
                  gpkg: { label: GPKG_LABEL, path: '', exists: false },
                  product: { label: PRODUCT_LABEL, path: '', exists: false },
                  metadata: { label: METADATA_LABEL, path: '', exists: false }
                }),
                sendParent({ type: "CLEAN_ERRORS" })
              ],
              target: `#${WORKFLOW.FILES.ROOT}`
            },
            "*": { actions: warnUnexpectedStateEvent }
          }
        },
        [WORKFLOW.FILES.AUTO.SELECT_FILES]: {
          entry: () => console.log(`>>> Enter ${WORKFLOW.FILES.AUTO.SELECT_FILES}`),
          tags: [STATE_TAGS.GENERAL_LOADING],
          invoke: {
            input: (_: { context: IContext; event: any }) => _,
            src: SERVICES[WORKFLOW.FILES.ROOT].selectFilesService,
            onDone: {
              actions: [
                assign((_: { context: IContext; event: any }) => ({
                  files: {
                    ..._.context.files,
                    gpkg: {
                      ..._.context.files?.gpkg,
                      ..._.event.output.gpkg
                    },
                    product: {
                      ..._.context.files?.product,
                      ..._.event.output.product
                    },
                    metadata: {
                      ..._.context.files?.metadata,
                      ..._.event.output.metadata
                    }
                  }
                })),
                sendParent((_: { context: IContext; event: any }) => ({
                  type: "SET_FILES",
                  files: {
                    ..._.event.output
                  },
                  addPolicy: "merge"
                }))
              ],
              target: WORKFLOW.FILES.AUTO.FETCH_PRODUCT
            },
            onError: {
              actions: filesErrorActions,
              target: WORKFLOW.FILES.AUTO.IDLE
            }
          }
        },
        [WORKFLOW.FILES.AUTO.FETCH_PRODUCT]: {
          entry: (_: { context: IContext; event: any }) => console.log(`>>> ${WORKFLOW.FILES.AUTO.FETCH_PRODUCT}`, _),
          tags: [STATE_TAGS.GENERAL_LOADING],
          invoke: {
            input: (_: { context: IContext; event: any }) => _,
            src: SERVICES[WORKFLOW.FILES.ROOT].fetchProductService,
            onDone: {
              actions: fetchProductActions,
              target: WORKFLOW.FILES.AUTO.CHECK_METADATA
            },
            onError: {
              actions: filesErrorActions,
              target: WORKFLOW.FILES.AUTO.IDLE
            }
          }
        },
        [WORKFLOW.FILES.AUTO.CHECK_METADATA]: {
          entry: (_: { context: IContext; event: any }) => console.log(`>>> ${WORKFLOW.FILES.AUTO.CHECK_METADATA}`, _),
          invoke: {
            input: (_: { context: IContext; event: any }) => _,
            src: SERVICES[WORKFLOW.FILES.ROOT].checkMetadataService,
            onDone: {
              actions: [
                sendParent({ type: "FILES_SELECTED" })
              ],
              target: WORKFLOW.FILES.AUTO.IDLE
            },
            onError: {
              actions: filesErrorActions,
              target: WORKFLOW.FILES.AUTO.IDLE
            }
          }
        }
      }
    },
    [WORKFLOW.FILES.MANUAL.ROOT]: {
      entry: (_: { context: IContext; event: any }) => console.log(`>>> ${WORKFLOW.FILES.MANUAL.ROOT}`, _),
      initial: WORKFLOW.FILES.MANUAL.IDLE,
      states: {
        [WORKFLOW.FILES.MANUAL.IDLE]: {
          entry: () => console.log(`>>> Enter ${WORKFLOW.FILES.MANUAL.ROOT.toLocaleUpperCase()}.${WORKFLOW.FILES.MANUAL.IDLE}`),
          on: {
            SELECT_GPKG: {
              actions: selectFileActions('gpkg'),
              target: WORKFLOW.FILES.MANUAL.SELECT_GPKG
            },
            SELECT_PRODUCT: {
              actions: selectFileActions('product'),
              target: WORKFLOW.FILES.MANUAL.FETCH_PRODUCT
            },
            SELECT_METADATA: {
              actions: selectFileActions('metadata'),
              target: WORKFLOW.FILES.MANUAL.CHECK_METADATA
            },
            AUTO: {
              actions: [
                ...selectionModeActions('auto' as SelectionMode),
                sendParent({ type: "CLEAN_ERRORS" })
              ],
              target: `#${WORKFLOW.FILES.ROOT}`
            },
            "*": { actions: warnUnexpectedStateEvent }
          }
        },
        [WORKFLOW.FILES.MANUAL.SELECT_GPKG]: {
          entry: () => console.log(`>>> Enter ${WORKFLOW.FILES.MANUAL.SELECT_GPKG}`),
          tags: [STATE_TAGS.GENERAL_LOADING],
          invoke: {
            input: (_: { context: IContext; event: any }) => _,
            src: SERVICES[WORKFLOW.FILES.ROOT].selectGpkgService,
            onDone: {
              actions: [
                assign((_: { context: IContext; event: any }) => ({
                  files: {
                    ..._.context.files,
                    gpkg: {
                      ..._.context.files?.gpkg,
                      ..._.event.output.gpkg
                    }
                  }
                })),
                sendParent((_: { context: IContext; event: any }) => ({
                  type: "SET_FILES",
                  files: {
                    ..._.context.files,
                    gpkg: {
                      ..._.context.files?.gpkg,
                      ..._.event.output
                    }
                  },
                  addPolicy: "merge"
                })),
                ...filesSelectedActions
              ],
              target: WORKFLOW.FILES.MANUAL.IDLE
            },
            onError: {
              actions: filesErrorActions,
              target: WORKFLOW.FILES.MANUAL.IDLE
            }
          }
        },
        [WORKFLOW.FILES.MANUAL.FETCH_PRODUCT]: {
          entry: (_: { context: IContext; event: any }) => console.log(`>>> ${WORKFLOW.FILES.MANUAL.FETCH_PRODUCT}`, _),
          tags: [STATE_TAGS.GENERAL_LOADING],
          invoke: {
            input: (_: { context: IContext; event: any }) => _,
            src: SERVICES[WORKFLOW.FILES.ROOT].fetchProductService,
            onDone: {
              actions: [
                ...fetchProductActions,
                ...filesSelectedActions
              ],
              target: WORKFLOW.FILES.MANUAL.IDLE
            },
            onError: {
              actions: filesErrorActions,
              target: WORKFLOW.FILES.MANUAL.IDLE
            }
          }
        },
        [WORKFLOW.FILES.MANUAL.CHECK_METADATA]: {
          entry: (_: { context: IContext; event: any }) => console.log(`>>> ${WORKFLOW.FILES.MANUAL.CHECK_METADATA}`, _),
          invoke: {
            input: (_: { context: IContext; event: any }) => _,
            src: SERVICES[WORKFLOW.FILES.ROOT].checkMetadataService,
            onDone: {
              actions: [
                ...filesSelectedActions
              ],
              target: WORKFLOW.FILES.MANUAL.IDLE
            },
            onError: {
              actions: filesErrorActions,
              target: WORKFLOW.FILES.MANUAL.IDLE
            }
          }
        }
      }
    }
  }
});
//#endregion

//#region --- WORKFLOW state machine ---
// @ts-ignore
export const workflowMachine = createMachine<IContext, Events>({
  id: WORKFLOW.ROOT,
  initial: WORKFLOW.IDLE,
  context: ({ input }) => ({
    ...input as IContext,
    errors: []
  }),
  entry: () => console.log(`>>> Enter ${WORKFLOW.ROOT.toUpperCase()} state machine`),
  states: {
    [WORKFLOW.IDLE]: {
      entry: () => console.log(`>>> Enter ${WORKFLOW.ROOT.toUpperCase()}.${WORKFLOW.IDLE}`),
      id: WORKFLOW.IDLE,
      on: {
        START_NEW: {
          actions: assign((_: { context: IContext; event: any }) => ({
            ..._.event
          })),
          target: WORKFLOW.FILES.ROOT
        },
        START_UPDATE: {
          actions: assign((_: { context: IContext; event: any }) => ({
            ..._.event
          })),
          target: WORKFLOW.START_UPDATE
        },
        RESELECT_FILES: {
          target: WORKFLOW.FILES.ROOT
        },
        SUBMIT: {
          actions: assign((_: { context: IContext; event: any }) => ({
            formData: {
              ..._.event.data
            },
            resolutionDegree: _.event.resolutionDegree
          })),
          target: WORKFLOW.JOB_SUBMISSION
        },
        RESTORE: {
          actions: assign((_: { context: IContext; event: any }) => ({
            restoreFromJob: {
              ..._.event.data
            }
          })),
          target: WORKFLOW.RESTORE_JOB
        },
        "*": { actions: warnUnexpectedStateEvent }
      }
    },
    [WORKFLOW.START_UPDATE]: {
      entry: () => console.log(`>>> Enter ${WORKFLOW.START_UPDATE}`),
      tags: [STATE_TAGS.GENERAL_LOADING],
      invoke: {
        input: (_: { context: IContext; event: any }) => _,
        src: SERVICES[WORKFLOW.ROOT].fetchActiveJobService,
        onDone: [
          {
            guard: (_: { context: IContext; event: any }) => {
              return false; // !!_.event.output.restoreFromJob;
            },
            actions: assign((_: { context: IContext; event: any }) => ({
              ..._.event.output
            })),
            target: WORKFLOW.RESTORE_JOB
          },
          {
            actions: assign((_: { context: IContext; event: any }) => ({
              flowType: Mode.UPDATE,
              selectionMode: CONFIG.SELECTION_MODE_DEFAULT === '' ? 'auto' : CONFIG.SELECTION_MODE_DEFAULT
            })),
            target: WORKFLOW.FILES.ROOT
          }
        ],
        onError: {
          actions: addError,
          target: WORKFLOW.ERROR
        }
      }
    },
    [WORKFLOW.FILES.ROOT]: {
      entry: () => console.log(`>>> Enter ${WORKFLOW.FILES.ROOT.toUpperCase()} sub state machine`),
      invoke: {
        id: WORKFLOW.FILES.ROOT, // <- needed to be able to target this state from the parent machine (child actor name)
        input: (_: { context: IContext; event: any }) => _.context,
        src: filesMachine
      },
      on: {
        SET_FILES: {
          actions: assign((_: { context: IContext; event: any }) => ({
            selectionMode: _.event.selectionMode ?
              _.event.selectionMode :
              _.context.selectionMode,
            files: _.event.addPolicy === 'merge' ?
              merge({}, _.context.files, _.event.files) :
              { ..._.event.files }
          }))
        },
        FILES_SELECTED: {
          target: `#${WORKFLOW.ROOT}`
        },
        FILES_ERROR: {
          actions: addError
        },
        CLEAN_ERRORS: {
          actions: assign({ errors: [] })
        },
        NOOP: { actions: () => {} },
        "*": { actions: warnUnexpectedStateEvent }
      }
    },
    [WORKFLOW.JOB_SUBMISSION]: {
      entry: () => console.log(`>>> Enter ${WORKFLOW.JOB_SUBMISSION}`),
      tags: [STATE_TAGS.GENERAL_LOADING],
      invoke: {
        input: (_: { context: IContext; event: any }) => _,
        src: SERVICES[WORKFLOW.ROOT].jobSubmissionService,
        onDone: {
          actions: assign((_: { context: IContext; event: any }) => ({
            job: {
              ..._.event.output
            }
          })),
          target: WORKFLOW.JOB_POLLING
        },
        onError: {
          actions: addError,
          target: WORKFLOW.ERROR
        }
      }
    },
    [WORKFLOW.JOB_POLLING]: {
      entry: () => console.log(`>>> Enter ${WORKFLOW.JOB_POLLING}`),
      invoke: {
        input: (_: { context: IContext; event: any }) => _,
        src: SERVICES[WORKFLOW.ROOT].jobPollingService,
        onDone: [
          {
            guard: (_: { context: IContext; event: any }) => {
              return _.event.output.taskStatus !== Status.InProgress;
            },
            actions: assign((_: { context: IContext; event: any }) => ({
              job: {
                ..._.context.job,
                ..._.event.output
              }
            })),
            target: WORKFLOW.DONE
          },
          {
            actions: assign((_: { context: IContext; event: any }) => ({
              job: {
                ..._.context.job,
                ..._.event.output
              }
            })),
            target: WORKFLOW.JOB_POLLING_WAIT
          }
        ],
        onError: {
          actions: addError,
          target: WORKFLOW.JOB_POLLING_WAIT
        }
      }
    },
    [WORKFLOW.JOB_POLLING_WAIT]: {
      entry: () => console.log(`>>> Enter ${WORKFLOW.JOB_POLLING_WAIT}`),
      after: {
        [CONFIG.JOB_STATUS.POLLING_CYCLE_INTERVAL]: WORKFLOW.JOB_POLLING
      }
    },
    [WORKFLOW.RESTORE_JOB]: {
      entry: () => console.log(`>>> Enter ${WORKFLOW.RESTORE_JOB}`),
      invoke: {
        input: (_: { context: IContext; event: any }) => _,
        src: SERVICES[WORKFLOW.ROOT].restoreJobService,
        onDone: {
          actions: assign((_: { context: IContext; event: any }) => ({
            ..._.event.output
          })),
          target: WORKFLOW.JOB_POLLING
        },
        onError: {
          actions: addError,
          target: WORKFLOW.ERROR
        }
      }
    },
    [WORKFLOW.DONE]: {
      entry: () => console.log(`>>> Enter ${WORKFLOW.DONE}`),
      type: "final"
    },
    [WORKFLOW.ERROR]: {
      entry: () => console.log(`>>> Enter ${WORKFLOW.ERROR}`),
      on: {
        RETRY: WORKFLOW.IDLE,
        "*": { actions: warnUnexpectedStateEvent }
      }
    }
  }
});
//#endregion
