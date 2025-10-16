import { createMachine } from 'xstate';

export const workflowMachine = createMachine({
  id: 'workflow',
  initial: 'idle',
  states: {
    idle: {
      on: {
        START_NEW: 'files',
        START_UPDATE: 'files',
        RESTORE: 'restoreJob'
      }
    },
    restoreJob: {
      on: {
        '': 'restoreReplay'
      }
    },
    restoreReplay: {
      always: 'files'
    },
    files: {
      id: 'files',
      initial: 'selectGpkg',
      states: {
        selectGpkg: {
          on: {
            SELECT_GPKG: 'validateGpkg'
          }
        },
        validateGpkg: {
          initial: 'validation',
          states: {
            validation: {
              invoke: {
                src: 'validationService',
                onDone: 'success',
                onError: 'failure'
              }
            },
            success: {
              type: 'final'
            },
            failure: {
              type: 'final'
            }
          },
          onDone: 'selectionMode'
        },
        selectionMode: {
          type: 'parallel',
          states: {
            listening: {
              on: {
                SUBMIT: 'jobSubmission',
                SELECT_GPKG: 'validateGpkg'
              }
            },
            auto: {
              initial: 'auto',
              states: {
                auto: {
                  invoke: {
                    src: 'autoService',
                    onDone: 'fetchProduct',
                    onError: '#files.error'
                  }
                },
                fetchProduct: {
                  invoke: {
                    src: 'fetchProductService',
                    onDone: '#files'
                  }
                }
              }
            },
            manual: {
              on: {
                SELECT_PRODUCT: {},
                SELECT_METADATA: {},
                CHECK_SELECTIONS: 'fetchProduct'
              }
            }
          }
        },
        error: {
          on: {
            RETRY: 'selectGpkg'
          }
        }
      },
      on: {
        SET_FILES: {},
        FILES_ERROR: 'error',
        CLEAN_ERRORS: {}
      }
    },
    jobSubmission: {
      invoke: {
        src: 'jobSubmissionService',
        onDone: 'jobPolling',
        onError: 'error'
      }
    },
    jobPolling: {
      invoke: {
        src: 'pollJobStatus',
        onDone: 'done',
        onError: 'error'
      }
    },
    done: {
      type: 'final'
    },
    error: {
      on: {
        RETRY: 'idle'
      }
    }
  }
});
