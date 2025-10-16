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
              on: {
                'done': 'success',
                'error': 'failure'
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
          initial: 'auto',
          states: {
            auto: {
              on: {
                done: 'fetchProduct',
                error: '#files.error'
              }
            },
            manual: {
              on: {
                SELECT_PRODUCT: {},
                SELECT_METADATA: {},
                CHECK_SELECTIONS: 'fetchProduct'
              }
            },
            fetchProduct: {
              on: {
                done: '#files'
              }
            }
          },
          on: {
            AUTO: '.auto',
            MANUAL: '.manual'
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
      on: {
        done: 'jobPolling',
        error: 'error'
      }
    },
    jobPolling: {
      on: {
        done: 'done',
        error: 'error'
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
  },
  on: {
    SUBMIT: 'jobSubmission'
  }
});
