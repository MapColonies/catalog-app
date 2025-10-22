/*import { merge } from 'lodash';
import { assign, createMachine } from 'xstate';
import CONFIG from '../../../../../common/config';
import { Mode } from '../../../../../common/models/mode.enum';
import { Status } from '../../../../models';
import { addError, warnUnexpectedStateEvent } from './helpers';
import { SERVICES } from './services';
import { IContext, STATE_TAGS, WORKFLOW } from './types';

//#region --- Guards ---
const hasSelectedFiles = (_: { context: IContext }) => {
  const files = _.context.files ?? {};
  return !!(files.gpkg && (files.metadata || files.product));
};
//#endregion

//#region --- Workflow Machine ---
export const workflowMachine = createMachine<IContext>({
  id: WORKFLOW.ROOT,
  initial: WORKFLOW.IDLE,
  context: ({ input }) => ({
    ...input,
    errors: [],
  }),
  entry: () => console.log(`>>> Enter ${WORKFLOW.ROOT.toUpperCase()} state machine`),

  states: {
    // -------------------------------------------------
    // --- IDLE STATE ---
    // -------------------------------------------------
    [WORKFLOW.IDLE]: {
      entry: () => console.log(`>>> Enter ${WORKFLOW.IDLE}`),
      on: {
        START_NEW: {
          actions: assign({ flowType: Mode.NEW }),
          target: WORKFLOW.FILES.ROOT,
        },
        START_UPDATE: {
          actions: assign({ flowType: Mode.UPDATE }),
          target: WORKFLOW.FILES.ROOT,
        },
        RESTORE: WORKFLOW.RESTORE_JOB,
      },
    },

    // -------------------------------------------------
    // --- RESTORE JOB ---
    // -------------------------------------------------
    [WORKFLOW.RESTORE_JOB]: {
      entry: () => console.log(`>>> Enter ${WORKFLOW.RESTORE_JOB}`),
      tags: [STATE_TAGS.GENERAL_LOADING],
      invoke: {
        src: 'fetchJobData',
        onDone: {
          actions: assign((_: { context: IContext; event: any }) => ({
            flowType: _.event.output.flowType,
            files: _.event.output.files,
            formData: _.event.output.formData,
            job: _.event.output.job,
          })),
          target: WORKFLOW.JOB_POLLING,
        },
        onError: {
          actions: addError,
          target: WORKFLOW.ERROR,
        },
      },
    },

    // -------------------------------------------------
    // --- FILES MODE ROOT ---
    // -------------------------------------------------
    [WORKFLOW.FILES.ROOT]: {
      entry: () => console.log(`>>> Enter FILES mode root`),
      initial: 'selectGpkg',
      states: {
        // ---------------------------------------------
        // --- SELECT GPKG ---
        // ---------------------------------------------
        selectGpkg: {
          entry: () => console.log(`>>> Enter SELECT_GPKG`),
          on: {
            SELECT_GPKG: {
              actions: assign((_: { context: IContext; event: any }) => ({
                files: merge({}, _.context.files, { gpkg: _.event.file }),
              })),
              target: 'validateGpkg',
            },
            '*': { actions: warnUnexpectedStateEvent },
          },
        },

        // ---------------------------------------------
        // --- VALIDATE GPKG ---
        // ---------------------------------------------
        validateGpkg: {
          entry: () => console.log(`>>> Enter VALIDATE_GPKG`),
          tags: [STATE_TAGS.GENERAL_LOADING],
          invoke: {
            src: SERVICES[WORKFLOW.FILES.ROOT].validationService,
            input: (_: { context: IContext }) => _.context.files.gpkg,
            onDone: {
              actions: assign((_: { context: IContext; event: any }) => ({
                files: merge({}, _.context.files, {
                  gpkg: _.event.output,
                }),
              })),
              target: 'modeSelection',
            },
            onError: {
              actions: addError,
              target: 'selectGpkg',
            },
          },
        },

        // ---------------------------------------------
        // --- MODE SELECTION ---
        // ---------------------------------------------
        modeSelection: {
          entry: () => console.log(`>>> MODE SELECTION`),
          on: {
            AUTO: 'autoMode',
            MANUAL: 'manualMode',
          },
        },

        // ---------------------------------------------
        // --- AUTO MODE ---
        // ---------------------------------------------
        autoMode: {
          entry: () => console.log(`>>> AUTO MODE`),
          on: {
            SELECT_GPKG: {
              actions: assign((_: { context: IContext; event: any }) => ({
                files: merge({}, _.context.files, { gpkg: _.event.file }),
              })),
            },
            SUBMIT: {
              guard: hasSelectedFiles,
              target: '#' + WORKFLOW.JOB_POLLING,
            },
            '*': { actions: warnUnexpectedStateEvent },
          },
        },

        // ---------------------------------------------
        // --- MANUAL MODE ---
        // ---------------------------------------------
        manualMode: {
          entry: () => console.log(`>>> MANUAL MODE`),
          on: {
            SELECT_GPKG: {
              actions: assign((_: { context: IContext; event: any }) => ({
                files: merge({}, _.context.files, { gpkg: _.event.file }),
              })),
            },
            SELECT_PRODUCT: {
              actions: assign((_: { context: IContext; event: any }) => ({
                files: merge({}, _.context.files, { product: _.event.file }),
              })),
            },
            SELECT_METADATA: {
              actions: assign((_: { context: IContext; event: any }) => ({
                files: merge({}, _.context.files, { metadata: _.event.file }),
              })),
            },
            SUBMIT: {
              guard: hasSelectedFiles,
              target: '#' + WORKFLOW.JOB_POLLING,
            },
            '*': { actions: warnUnexpectedStateEvent },
          },
        },
      },
    },

    // -------------------------------------------------
    // --- JOB SUBMISSION ---
    // (If you still want to support separate submission before polling)
    // -------------------------------------------------
    [WORKFLOW.JOB_SUBMISSION]: {
      entry: () => console.log(`>>> Enter ${WORKFLOW.JOB_SUBMISSION}`),
      invoke: {
        src: SERVICES[WORKFLOW.ROOT].jobSubmissionService,
        input: (_: { context: IContext }) => _.context.formData,
        onDone: {
          actions: assign((_: { context: IContext; event: any }) => ({
            job: { ..._.event.output },
          })),
          target: WORKFLOW.JOB_POLLING,
        },
        onError: {
          actions: addError,
          target: WORKFLOW.ERROR,
        },
      },
    },

    // -------------------------------------------------
    // --- JOB POLLING ---
    // -------------------------------------------------
    [WORKFLOW.JOB_POLLING]: {
      entry: () => console.log(`>>> Enter ${WORKFLOW.JOB_POLLING}`),
      tags: [STATE_TAGS.GENERAL_LOADING],
      invoke: {
        src: SERVICES[WORKFLOW.ROOT].jobPollingService,
        input: (_: { context: IContext }) => _.context.job,
        onDone: [
          {
            guard: (_: { context: IContext; event: any }) =>
              _.event.output.taskStatus === Status.Completed,
            actions: assign((_: { context: IContext; event: any }) => ({
              job: { ..._.event.output },
            })),
            target: WORKFLOW.DONE,
          },
          {
            actions: assign((_: { context: IContext; event: any }) => ({
              job: { ..._.event.output },
            })),
            target: WORKFLOW.JOB_POLLING_WAIT,
          },
        ],
        onError: {
          actions: addError,
          target: WORKFLOW.JOB_POLLING_WAIT,
        },
      },
    },

    // -------------------------------------------------
    // --- JOB POLLING WAIT ---
    // -------------------------------------------------
    [WORKFLOW.JOB_POLLING_WAIT]: {
      entry: () => console.log(`>>> Enter ${WORKFLOW.JOB_POLLING_WAIT}`),
      after: {
        [CONFIG.JOB_STATUS.POLLING_CYCLE_INTERVAL]: WORKFLOW.JOB_POLLING,
      },
    },

    // -------------------------------------------------
    // --- DONE / ERROR ---
    // -------------------------------------------------
    [WORKFLOW.DONE]: {
      type: 'final',
      entry: () => console.log(`>>> Enter ${WORKFLOW.DONE}`),
    },

    [WORKFLOW.ERROR]: {
      entry: () => console.log(`>>> Enter ${WORKFLOW.ERROR}`),
      on: {
        RETRY: WORKFLOW.IDLE,
        '*': { actions: warnUnexpectedStateEvent },
      },
    },
  },
});
//#endregion
*/