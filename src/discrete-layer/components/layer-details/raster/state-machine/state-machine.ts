import { merge } from 'lodash';
import { assign, createMachine, sendParent } from 'xstate';
import CONFIG from '../../../../../common/config';
import { Status } from '../../../../models';
import { addError, warnUnexpectedStateEvent } from './helpers';
import { SERVICES } from './services';
import { IContext, STATE_TAGS, WORKFLOW } from './types';

//#region --- Guards ---
/*const hasSelectedFiles = (_: { context: IContext }) => {
  const files = _.context.files ?? {};
  return !!(files.gpkg && files.product && files.metadata);
};*/
//#endregion

//#region --- selection mode states ---
const selectionModeStates = {
  [WORKFLOW.FILES.SELECTION_MODE.DECIDE_MODE]: {
    always: [
      {
        guard: (_: { context: IContext; event: any }) => _.context.selectionMode === 'manual',
        target: WORKFLOW.FILES.SELECTION_MODE.MANUAL.ROOT
      },
      {
        target: WORKFLOW.FILES.SELECTION_MODE.AUTO.ROOT
      }
    ]
  },
  [WORKFLOW.FILES.SELECTION_MODE.AUTO.ROOT]: {
    entry: (_: { context: IContext; event: any }) => console.log(`>>> ${WORKFLOW.FILES.SELECTION_MODE.AUTO.ROOT}`, _),
    tags: [STATE_TAGS.GENERAL_LOADING],
    initial: WORKFLOW.FILES.SELECTION_MODE.AUTO.IDLE,
    states: {
      [WORKFLOW.FILES.SELECTION_MODE.AUTO.IDLE]: {
        entry: () => console.log(`>>> Enter ${WORKFLOW.FILES.SELECTION_MODE.AUTO.ROOT.toUpperCase()}.${WORKFLOW.FILES.SELECTION_MODE.AUTO.IDLE}`),
        on: {
          SELECT_FILES: {
            actions: [
              assign((_: { context: IContext; event: any }) => ({
                files: {
                  gpkg: {
                    ..._.event.file
                  }
                }
              })),
              sendParent((_: { context: IContext; event: any }) => ({
                type: "SET_FILES",
                files: {
                  gpkg: {
                    ..._.event.file
                  }
                },
                addPolicy: "override"
              })),
              sendParent({ type: "CLEAN_ERRORS" })
            ],
            target: WORKFLOW.FILES.SELECTION_MODE.AUTO.SELECT_FILES
          },
          MANUAL: {
            actions: [
              assign({ selectionMode: 'manual', files: {} }),
              sendParent({ type: "SET_FILES", files: {}, addPolicy: "override" })
            ],
            target: `#${WORKFLOW.FILES.ROOT}`
          },
          "*": { actions: warnUnexpectedStateEvent }
        }
      },
      [WORKFLOW.FILES.SELECTION_MODE.AUTO.SELECT_FILES]: {
        entry: () => console.log(`>>> Enter ${WORKFLOW.FILES.SELECTION_MODE.AUTO.SELECT_FILES}`),
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
            target: WORKFLOW.FILES.SELECTION_MODE.AUTO.FETCH_PRODUCT
          },
          onError: {
            actions: [
              sendParent((_: { context: IContext; event: any }) => ({
                type: "FILES_ERROR",
                error: { ..._.event.error }
              })),
            ],
            target: WORKFLOW.FILES.SELECTION_MODE.AUTO.IDLE
          }
        }
      },
      [WORKFLOW.FILES.SELECTION_MODE.AUTO.FETCH_PRODUCT]: {
        entry: (_: { context: IContext; event: any }) => console.log(`>>> ${WORKFLOW.FILES.SELECTION_MODE.AUTO.FETCH_PRODUCT}`, _),
        tags: [STATE_TAGS.GENERAL_LOADING],
        invoke: {
          input: (_: { context: IContext; event: any }) => _,
          src: SERVICES[WORKFLOW.FILES.ROOT].fetchProductService,
          onDone: {
            actions: [
              assign((_: { context: IContext; event: any }) => ({
                files: {
                  ..._.context.files,
                  product: {
                    ..._.context.files?.product,
                    ..._.event.output
                  }
                }
              })),
              sendParent((_: { context: IContext; event: any }) => ({
                type: "SET_FILES",
                files: {
                  product: {
                    ..._.event.output
                  }
                },
                addPolicy: "merge"
              })),
              sendParent({ type: "FILES_SELECTED" })
            ],
            target: WORKFLOW.FILES.SELECTION_MODE.AUTO.CHECK_METADATA
          },
          onError: {
            actions: sendParent((_: { context: IContext; event: any }) => ({
              type: "FILES_ERROR",
              error: { ..._.event.error }
            })),
            target: WORKFLOW.FILES.SELECTION_MODE.AUTO.IDLE
          }
        }
      },
      [WORKFLOW.FILES.SELECTION_MODE.AUTO.CHECK_METADATA]: {
        entry: (_: { context: IContext; event: any }) => console.log(`>>> ${WORKFLOW.FILES.SELECTION_MODE.AUTO.CHECK_METADATA}`, _),
        tags: [STATE_TAGS.GENERAL_LOADING],
        invoke: {
          input: (_: { context: IContext; event: any }) => _,
          src: SERVICES[WORKFLOW.FILES.ROOT].checkMetadataService,
          onDone: {
            target: WORKFLOW.FILES.SELECTION_MODE.AUTO.IDLE
          },
          onError: {
            actions: sendParent((_: { context: IContext; event: any }) => ({
              type: "FILES_ERROR",
              error: { ..._.event.error }
            })),
            target: WORKFLOW.FILES.SELECTION_MODE.AUTO.IDLE
          }
        }
      }
    }
  },
  [WORKFLOW.FILES.SELECTION_MODE.MANUAL.ROOT]: {
    entry: (_: { context: IContext; event: any }) => console.log(`>>> ${WORKFLOW.FILES.SELECTION_MODE.MANUAL.ROOT}`, _),
    tags: [STATE_TAGS.GENERAL_LOADING],
    initial: WORKFLOW.FILES.SELECTION_MODE.MANUAL.IDLE,
    states: {
      [WORKFLOW.FILES.SELECTION_MODE.MANUAL.IDLE]: {
        entry: () => console.log(`>>> Enter ${WORKFLOW.FILES.SELECTION_MODE.MANUAL.ROOT.toLocaleUpperCase()}.${WORKFLOW.FILES.SELECTION_MODE.MANUAL.IDLE}`),
        on: {
          SELECT_GPKG: {
            actions: [
              assign((_: { context: IContext; event: any }) => ({
                files: {
                  ..._.context.files,
                  gpkg: {
                    ..._.event.file
                  }
                }
              })),
              sendParent((_: { context: IContext; event: any }) => ({
                type: "SET_FILES",
                files: {
                  gpkg: {
                    ..._.event.file
                  }
                },
                addPolicy: "merge"
              }))
            ],
            target: WORKFLOW.FILES.SELECTION_MODE.MANUAL.SELECT_GPKG
          },
          SELECT_PRODUCT: {
            actions: [
              assign((_: { context: IContext; event: any }) => ({
                files: {
                  ..._.context.files,
                  product: {
                    ..._.event.file
                  }
                }
              })),
              sendParent((_: { context: IContext; event: any }) => ({
                type: "SET_FILES",
                files: {
                  product: {
                    ..._.event.file
                  }
                },
                addPolicy: "merge"
              }))
            ],
            target: WORKFLOW.FILES.SELECTION_MODE.MANUAL.FETCH_PRODUCT
          },
          SELECT_METADATA: {
            actions: [
              assign((_: { context: IContext; event: any }) => ({
                files: {
                  ..._.context.files,
                  metadata: {
                    ..._.event.file
                  }
                }
              })),
              sendParent((_: { context: IContext; event: any }) => ({
                type: "SET_FILES",
                files: {
                  metadata: {
                    ..._.event.file
                  }
                },
                addPolicy: "merge"
              }))
            ],
            target: WORKFLOW.FILES.SELECTION_MODE.MANUAL.IDLE
          },
          AUTO: {
            actions: [
              assign({ selectionMode: 'auto', files: {} }),
              sendParent({ type: "SET_FILES", files: {}, addPolicy: "override" })
            ],
            target: `#${WORKFLOW.FILES.ROOT}`
          },
          "*": { actions: warnUnexpectedStateEvent }
        }
      },
      [WORKFLOW.FILES.SELECTION_MODE.MANUAL.SELECT_GPKG]: {
        entry: () => console.log(`>>> Enter ${WORKFLOW.FILES.SELECTION_MODE.MANUAL.SELECT_GPKG}`),
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
              }))
            ],
            target: WORKFLOW.FILES.SELECTION_MODE.MANUAL.IDLE
          },
          onError: {
            actions: [
              sendParent((_: { context: IContext; event: any }) => ({
                type: "FILES_ERROR",
                error: { ..._.event.error }
              })),
            ],
            target: WORKFLOW.FILES.SELECTION_MODE.MANUAL.IDLE
          }
        }
      },
      [WORKFLOW.FILES.SELECTION_MODE.MANUAL.FETCH_PRODUCT]: {
        entry: (_: { context: IContext; event: any }) => console.log(`>>> ${WORKFLOW.FILES.SELECTION_MODE.MANUAL.FETCH_PRODUCT}`, _),
        tags: [STATE_TAGS.GENERAL_LOADING],
        invoke: {
          input: (_: { context: IContext; event: any }) => _,
          src: SERVICES[WORKFLOW.FILES.ROOT].fetchProductService,
          onDone: {
            actions: [
              assign((_: { context: IContext; event: any }) => ({
                files: {
                  ..._.context.files,
                  product: {
                    ..._.context.files?.product,
                    ..._.event.output
                  }
                }
              })),
              sendParent((_: { context: IContext; event: any }) => ({
                type: "SET_FILES",
                files: {
                  product: {
                    ..._.event.output
                  }
                },
                addPolicy: "merge"
              })),
              sendParent({ type: "FILES_SELECTED" })
            ],
            target: WORKFLOW.FILES.SELECTION_MODE.MANUAL.IDLE
          },
          onError: {
            actions: sendParent((_: { context: IContext; event: any }) => ({
              type: "FILES_ERROR",
              error: { ..._.event.error }
            })),
            target: WORKFLOW.FILES.SELECTION_MODE.MANUAL.IDLE
          }
        }
      }
    }
  }
};
//#endregion

//#region --- FILES sub state machine ---
const filesMachine = createMachine({
  id: WORKFLOW.FILES.ROOT,
  initial: WORKFLOW.FILES.SELECTION_MODE.ROOT,
  context: (ctx: any) => ctx.input,
  states: {
    [WORKFLOW.FILES.SELECTION_MODE.ROOT]: {
      entry: () => console.log(`>>> Enter ${WORKFLOW.FILES.SELECTION_MODE.ROOT}`),
      type: "compound",
      initial: WORKFLOW.FILES.SELECTION_MODE.DECIDE_MODE,
      states: selectionModeStates,
      on: {
        AUTO: `.${WORKFLOW.FILES.SELECTION_MODE.AUTO.ROOT}`,
        MANUAL: `.${WORKFLOW.FILES.SELECTION_MODE.MANUAL.ROOT}`,
        "*": { actions: warnUnexpectedStateEvent }
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
      on: {
        START: {
          actions: assign((_: { context: IContext; event: any }) => ({
            ..._.event
          })),
          target: WORKFLOW.FILES.ROOT
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
            ..._.event.data
          })),
          target: WORKFLOW.RESTORE_JOB
        },
        "*": { actions: warnUnexpectedStateEvent }
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
      invoke: {
        input: (_: { context: IContext; event: any }) => _,
        tags: [STATE_TAGS.GENERAL_LOADING],
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
            guard: (_: { context: IContext; event: any }) => _.event.output.taskStatus === Status.Completed,
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
