import { mergeWith } from 'lodash';
import { assign, createMachine, sendParent } from 'xstate';
import CONFIG from '../../../../../common/config';
import { dateFormatter, relativeDateFormatter } from '../../../../../common/helpers/formatters';
import { Mode } from '../../../../../common/models/mode.enum';
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
  handleShapeFilesValidation,
  warnUnexpectedStateEvent
} from './helpers';
import { SERVICES } from './services';
import {
  DATA_LABEL,
  IContext,
  PRODUCT_LABEL,
  SHAPEMETADATA_LABEL,
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
                ...selectFileActions('data', 'override', false),
                sendParent({ type: "CLEAN_ERRORS" })
              ],
              target: WORKFLOW.FILES.AUTO.SELECT_FILES
            },
            MANUAL: {
              actions: selectionModeActions('manual' as SelectionMode, {
                data: { label: DATA_LABEL, path: '', exists: false, dateFormatterPredicate: dateFormatter },
                product: { label: PRODUCT_LABEL, path: '', exists: false, dateFormatterPredicate: relativeDateFormatter },
                shapeMetadata: { label: SHAPEMETADATA_LABEL, path: '', exists: false, dateFormatterPredicate: relativeDateFormatter }
              }),
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
                  files: mergeWith(
                    {},
                    _.context.files,
                    _.event.output,
                    (objValue: any, srcValue: any, key: string) => {
                      if (key === 'geoDetails') {
                        return srcValue;
                      }
                    }
                  )
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
              target: WORKFLOW.FILES.AUTO.CHECK_SHAPEMETADATA
            },
            onError: {
              actions: filesErrorActions,
              target: WORKFLOW.FILES.AUTO.IDLE
            }
          }
        },
        [WORKFLOW.FILES.AUTO.CHECK_SHAPEMETADATA]: {
          entry: (_: { context: IContext; event: any }) => console.log(`>>> ${WORKFLOW.FILES.AUTO.CHECK_SHAPEMETADATA}`, _),
          invoke: {
            input: (_: { context: IContext; event: any }) => _,
            src: SERVICES[WORKFLOW.FILES.ROOT].checkShapeMetadataService,
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
            SELECT_DATA: {
              actions: selectFileActions('data'),
              target: WORKFLOW.FILES.MANUAL.SELECT_DATA
            },
            SELECT_PRODUCT: {
              actions: selectFileActions('product'),
              target: WORKFLOW.FILES.MANUAL.FETCH_PRODUCT
            },
            SELECT_SHAPEMETADATA: {
              actions: selectFileActions('shapeMetadata'),
              target: WORKFLOW.FILES.MANUAL.CHECK_SHAPEMETADATA
            },
            AUTO: {
              actions: selectionModeActions('auto' as SelectionMode),
              target: `#${WORKFLOW.FILES.ROOT}`
            },
            "*": { actions: warnUnexpectedStateEvent }
          }
        },
        [WORKFLOW.FILES.MANUAL.SELECT_DATA]: {
          entry: () => console.log(`>>> Enter ${WORKFLOW.FILES.MANUAL.SELECT_DATA}`),
          tags: [STATE_TAGS.GENERAL_LOADING],
          invoke: {
            input: (_: { context: IContext; event: any }) => _,
            src: SERVICES[WORKFLOW.FILES.ROOT].selectDataService,
            onDone: {
              actions: [
                assign((_: { context: IContext; event: any }) => ({
                  files: {
                    ..._.context.files,
                    data: {
                      ..._.context.files?.data,
                      ..._.event.output
                    }
                  }
                })),
                sendParent((_: { context: IContext; event: any }) => ({
                  type: "SET_FILES",
                  files: {
                    data: {
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
        [WORKFLOW.FILES.MANUAL.CHECK_SHAPEMETADATA]: {
          entry: (_: { context: IContext; event: any }) => console.log(`>>> ${WORKFLOW.FILES.MANUAL.CHECK_SHAPEMETADATA}`, _),
          invoke: {
            input: (_: { context: IContext; event: any }) => _,
            src: SERVICES[WORKFLOW.FILES.ROOT].checkShapeMetadataService,
            onDone: {
              actions: filesSelectedActions,
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
            job: {
              ..._.event.job
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
              return false;// !!_.event.output.jobId;
            },
            actions: assign((_: { context: IContext; event: any }) => ({
              job: {
                ..._.event.output
              }
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
          target: WORKFLOW.IDLE
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
        SET_SELECTION_MODE: {
          actions: assign((_: { context: IContext; event: any }) => ({
            selectionMode: _.event.selectionMode
          }))
        },
        SET_FILES: {
          actions: assign((_: { context: IContext; event: any }) => {
            const files = _.event.addPolicy === 'merge' ?
              mergeWith(
                {},
                _.context.files,
                _.event.files,
                (objValue: any, srcValue: any, key: string) => {
                  if (key === 'geoDetails') {
                    return srcValue;
                  }
                }
              ) :
              { ..._.event.files };
            let errors = _.context.errors;
            errors = handleShapeFilesValidation(files);

            return {
              files,
              errors
            };
          })
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
          target: WORKFLOW.IDLE
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
              return _.event.output.details.status !== Status.InProgress &&
                _.event.output.details.status !== Status.Pending &&
                _.event.output.details.status !== Status.Suspended;
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
          target: WORKFLOW.IDLE
        }
      }
    },
    [WORKFLOW.JOB_POLLING_WAIT]: {
      entry: () => console.log(`>>> Enter ${WORKFLOW.JOB_POLLING_WAIT}`),
      after: {
        [CONFIG.JOB_MANAGER.POLLING_CYCLE_INTERVAL]: WORKFLOW.JOB_POLLING
      }
    },
    [WORKFLOW.RESTORE_JOB]: {
      entry: () => console.log(`>>> Enter ${WORKFLOW.RESTORE_JOB}`),
      tags: [STATE_TAGS.GENERAL_LOADING],
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
          target: WORKFLOW.IDLE
        }
      }
    },
    [WORKFLOW.DONE]: {
      entry: () => console.log(`>>> Enter ${WORKFLOW.DONE}`),
      type: "final"
    }
  }
});
//#endregion
