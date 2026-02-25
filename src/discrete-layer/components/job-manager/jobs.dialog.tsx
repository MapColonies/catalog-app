/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { cloneDeep, isEmpty } from 'lodash';
import { observer } from 'mobx-react';
import moment from 'moment';
import { DialogContent } from '@material-ui/core';
import {
  Button,
  Dialog,
  DialogTitle,
  IconButton,
} from '@map-colonies/react-core';
import {
  Box,
  DateTimeRangePicker,
  SupportedLocales,
} from '@map-colonies/react-components';
import { IActionGroup } from '../../../common/actions/entity.actions';
import { GraphQLError } from '../../../common/components/error/graphql.error-presentor';
import { LogicError } from '../../../common/components/error/logic.error-presentor';
import { GridApi } from '../../../common/components/grid';
import CONFIG from '../../../common/config';
import { dateFormatter } from '../../../common/helpers/formatters';
import useCountDown, { IActions } from '../../../common/hooks/countdown.hook';
import { JobModelType } from '../../models';
import { IDispatchAction } from '../../models/actionDispatcherStore';
import { useQuery, useStore } from '../../models/RootStore';
import { IError } from '../helpers/errorUtils';
import { downloadJSONToClient } from '../layer-details/utils';
import JobManagerGrid from './grids/job-manager-grid.common';
import { JOB_ENTITY } from './job.types';

import './jobs.dialog.css';

const START_CYCLE_ITERATION = 0;
const COUNTDOWN_REFRESH_RATE = 1000; // interval to change remaining time amount, defaults to 1000
const MILLISECONDS_IN_SEC = 1000;
const POLLING_CYCLE_INTERVAL = CONFIG.JOB_MANAGER.POLLING_CYCLE_INTERVAL;

interface JobsDialogProps {
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
  setRestoreFromJob: (job: JobModelType) => void;
  focusOnJob?: Partial<Pick<JobModelType, 'id' | 'resourceId' | 'updated'>>;
  setFocusOnJob?: (
    job:
      | Partial<Pick<JobModelType, 'id' | 'resourceId' | 'updated'>>
      | undefined
  ) => void;
}

export const JobsDialog: React.FC<JobsDialogProps> = observer(
  (props: JobsDialogProps) => {
    const store = useStore();
    const intl = useIntl();
    const { isOpen, onSetOpen, setRestoreFromJob, focusOnJob, setFocusOnJob } =
      props;
    const [updateTaskPayload, setUpdateTaskPayload] = useState<
      Record<string, unknown>
    >({});
    const [gridRowData, setGridRowData] = useState<JobModelType[] | undefined>(
      undefined
    );
    const [gridApi, setGridApi] = useState<GridApi>();
    const [pollingCycle, setPollingCycle] = useState(START_CYCLE_ITERATION);
    const [fromDate, setFromDate] = useState<Date | undefined>(
      moment()
        .subtract(CONFIG.JOB_MANAGER.FILTER_DAYS_TIME_SLOT, 'days')
        .startOf('day')
        .toDate()
    );
    const [tillDate, setTillDate] = useState<Date | undefined>(
      moment().endOf('day').toDate()
    );
    const [focusError, setFocusError] = useState<IError | undefined>(undefined);
    const [dateRangeError, setDateRangeError] = useState<IError | undefined>(
      undefined
    );
    const [errorMessages, setErrorMessages] = useState<IError[]>([]);
    const [timeLeft, actions] = useCountDown(
      POLLING_CYCLE_INTERVAL,
      COUNTDOWN_REFRESH_RATE
    );

    // start the timer during the first render
    useEffect(() => {
      (actions as IActions).start();
    }, []);

    // eslint-disable-next-line
    const { setQuery, loading, error, data, query } = useQuery(
      (store) =>
        store.queryJobs({
          params: {
            fromDate,
            tillDate,
          },
        }),
      {
        fetchPolicy: 'no-cache',
      }
    );

    //@ts-ignore
    const {
      setQuery: setQueryForOneJob,
      data: jobData,
      loading: loadingJobData,
    } = useQuery<Record<any, any>>((store) => undefined, {
      fetchPolicy: 'no-cache',
    });

    const mutationQuery = useQuery();

    const getJobActions = useMemo(() => {
      let actions: IActionGroup[] =
        store.actionDispatcherStore.getEntityActionGroups(JOB_ENTITY);

      actions = actions.map((action) => {
        const groupsWithTranslation = action.group.map((action) => {
          return {
            ...action,
            titleTranslationId: intl.formatMessage({
              id: action.titleTranslationId,
            }),
          };
        });
        return { ...action, group: groupsWithTranslation };
      });

      return {
        [JOB_ENTITY]: actions,
      };
    }, []);

    useEffect(() => {
      if (typeof fromDate !== 'undefined' && typeof tillDate !== 'undefined') {
        (actions as IActions).start(POLLING_CYCLE_INTERVAL);
        setQuery((store) =>
          store.queryJobs({
            params: {
              fromDate,
              tillDate,
            },
          })
        );
      }
    }, [fromDate, tillDate, setQuery]);

    useEffect(() => {
      if (data !== undefined) {
        const jobsData = data ? cloneDeep(data.jobs) : [];
        setGridRowData(jobsData);
      }
    }, [data]);

    useEffect(() => {
      if (mutationQuery.data) {
        setUpdateTaskPayload({});
        setQuery((store) =>
          store.queryJobs({
            params: {
              fromDate,
              tillDate,
            },
          })
        );
      }
    }, [mutationQuery.data]);

    useEffect(() => {
      if (updateTaskPayload.id !== undefined) {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        mutationQuery.setQuery(
          store.mutateUpdateJob(updateTaskPayload, () => {})
        );
      }
    }, [updateTaskPayload]);

    useEffect(() => {
      const pollingInterval = setInterval(() => {
        setErrorMessages((prev) =>
          upsertOrRemoveError(prev, undefined, 'error.server-error')
        );
        setPollingCycle((prevCycle) => prevCycle + 1);
        (actions as IActions).start(POLLING_CYCLE_INTERVAL);
        setQuery((store) =>
          store.queryJobs({
            params: {
              fromDate,
              tillDate,
            },
          })
        );
      }, POLLING_CYCLE_INTERVAL);

      return (): void => {
        clearInterval(pollingInterval);
      };
    }, [query, pollingCycle]);

    useEffect(() => {
      if (!loadingJobData && jobData) {
        downloadJSONToClient(
          jobData.job,
          `${encodeURI(jobData.job.resourceId as string)}_job_details.json`
        );
      }
    }, [jobData, loadingJobData]);

    const upsertOrRemoveError = (
      prevErrors: IError[],
      newError?: IError,
      newErrorCode?: string
    ): IError[] => {
      if (newError) {
        const filtered = prevErrors.filter((e) => e.code !== newError.code);
        return [...filtered, newError];
      } else {
        return prevErrors.filter((e) => e.code !== newErrorCode);
      }
    };

    useEffect(() => {
      let newError: IError | undefined = undefined;
      if (!isEmpty(mutationQuery.error)) {
        gridApi?.refreshCells({
          suppressFlash: true,
          force: true,
        });
        const NONE = 0;
        const serverError = mutationQuery.error.response.errors[0];
        const status = serverError.serverResponse?.status ?? NONE;
        let message = serverError.serverResponse?.data.message
          ? serverError.serverResponse.data.message
          : serverError.serverResponse?.statusText
          ? serverError.serverResponse?.statusText
          : serverError.message.substring(
              +serverError.message.indexOf('; ') + 1
            );
        newError = {
          code: 'error.server-error',
          message: `${status > NONE ? status + ' ' : ''}${message}`,
          level: 'error',
        };
      }
      setErrorMessages((prev) =>
        upsertOrRemoveError(prev, newError, 'error.server-error')
      );
    }, [mutationQuery.error]);

    useEffect(() => {
      let newError: IError | undefined = undefined;
      if (focusOnJob && focusError?.code) {
        newError = {
          code: focusError.code,
          message: `${focusOnJob.resourceId} <bdi>(${dateFormatter(
            focusOnJob.updated,
            true
          )})</bdi>`,
          level: focusError.level,
        };
      }
      setErrorMessages((prev) =>
        upsertOrRemoveError(prev, newError, 'warning.row-not-found')
      );
    }, [focusError]);

    useEffect(() => {
      setErrorMessages((prev) =>
        upsertOrRemoveError(prev, dateRangeError, 'warning.exceeded-date-range')
      );
    }, [dateRangeError]);

    const closeDialog = useCallback(() => {
      setFocusOnJob?.(undefined);
      onSetOpen(false);
    }, [onSetOpen]);

    const dispatchAction = (
      action: Record<string, unknown> | undefined
    ): void => {
      const actionToDispatch = (
        action ? { action: action.action, data: action.data } : action
      ) as IDispatchAction;
      store.actionDispatcherStore.dispatchAction(actionToDispatch);
    };

    // Job actions handler

    useEffect(() => {
      if (typeof store.actionDispatcherStore.action !== 'undefined') {
        const { action, data } = store.actionDispatcherStore
          .action as IDispatchAction;
        switch (action) {
          case 'Job.retry':
            mutationQuery.setQuery(
              store.mutateJobRetry({
                jobRetryParams: {
                  id: data.id as string,
                  domain: data.domain as string,
                  type: data.type as string,
                },
              })
            );
            break;
          case 'Job.abort': {
            mutationQuery.setQuery(
              store.mutateJobAbort({
                jobAbortParams: {
                  id: data.id as string,
                  domain: data.domain as string,
                  type: data.type as string,
                },
              })
            );
            break;
          }
          case 'Job.download_details':
            setQueryForOneJob((store) =>
              store.queryJob({
                id: data.id as string,
              })
            );
            break;
          case 'Job.restore':
            closeDialog();
            setRestoreFromJob(data as unknown as JobModelType);
            break;
          default:
            break;
        }
      }
    }, [store.actionDispatcherStore.action]);

    // Reset action value on store when unmounting

    useEffect(() => {
      return (): void => {
        dispatchAction(undefined);
      };
    }, []);

    const renderGridList = (): JSX.Element => {
      return (
        <Box className="gridsContainer">
          <JobManagerGrid
            dispatchAction={dispatchAction}
            getJobActions={getJobActions}
            rowData={gridRowData as JobModelType[]}
            onGridReadyCB={(params): void => {
              setGridApi(params.api);
            }}
            updateJobCB={setUpdateTaskPayload}
            rowDataChangeCB={(): void => {}}
            areJobsLoading={loading}
            focusOnJob={focusOnJob}
            setFocusOnJob={setFocusOnJob}
            handleFocusError={(err) => {
              setFocusError(err);
            }}
          />
        </Box>
      );
    };

    const renderDateTimeRangePicker = (): JSX.Element => {
      return (
        <Box className="jobsTimeRangePicker">
          <DateTimeRangePicker
            controlsLayout="row"
            dateFormat="dd/MM/yyyy"
            showTime={false}
            onChange={(dateRange: { from?: Date; to?: Date }): void => {
              setErrorMessages((prev) =>
                upsertOrRemoveError(prev, undefined, 'error.server-error')
              );
              const from = dateRange.from;
              const to = dateRange.to;
              const diff = moment(to).diff(moment(from), 'days');
              if (diff > CONFIG.JOB_MANAGER.MAX_DATE_RANGE_DAYS) {
                setDateRangeError({
                  code: 'warning.exceeded-date-range',
                  message: CONFIG.JOB_MANAGER.MAX_DATE_RANGE_DAYS,
                  level: 'warning',
                });
              } else {
                setDateRangeError(undefined);
                setFromDate(from);
                setTillDate(to);
              }
            }}
            from={fromDate}
            to={tillDate}
            local={{
              setText: intl.formatMessage({
                id: 'filters.date-picker.set-btn.text',
              }),
              startPlaceHolderText: intl.formatMessage({
                id: 'filters.date-picker.start-time.label',
              }),
              endPlaceHolderText: intl.formatMessage({
                id: 'filters.date-picker.end-time.label',
              }),
              calendarLocale:
                SupportedLocales[
                  CONFIG.I18N.DEFAULT_LANGUAGE.toUpperCase() as keyof typeof SupportedLocales
                ],
            }}
          />
        </Box>
      );
    };

    return (
      <Box id="jobsDialog">
        <Dialog open={isOpen} preventOutsideDismiss={true}>
          <DialogTitle>
            <FormattedMessage id="system-status.title" />
            <Box
              className="refreshContainer"
              onClick={(): void => {
                setErrorMessages((prev) =>
                  upsertOrRemoveError(prev, undefined, 'error.server-error')
                );
                (actions as IActions).start(POLLING_CYCLE_INTERVAL);
                setQuery((store) =>
                  store.queryJobs({
                    params: {
                      fromDate,
                      tillDate,
                    },
                  })
                );
              }}
            >
              <IconButton className="refreshIcon mc-icon-Refresh" />
              <Box className="refreshSecs">
                {`${(timeLeft as number) / MILLISECONDS_IN_SEC}`}
              </Box>
            </Box>
            <IconButton
              className="closeIcon mc-icon-Close"
              onClick={(): void => {
                closeDialog();
              }}
            />
          </DialogTitle>
          <DialogContent className="jobsBody">
            {renderDateTimeRangePicker()}
            {!error &&
              typeof fromDate !== 'undefined' &&
              typeof tillDate !== 'undefined' &&
              renderGridList()}
            {error && (
              <Box className="jobsDataError">
                <GraphQLError error={error} />
              </Box>
            )}
            <Box className="footer">
              <Box className="buttons">
                <Button
                  raised
                  type="button"
                  onClick={(): void => {
                    closeDialog();
                  }}
                >
                  <FormattedMessage id="system-status.close-btn.text" />
                </Button>
              </Box>
              <Box className="messages">
                {errorMessages.length > 0 && (
                  <LogicError errors={errorMessages} />
                )}
              </Box>
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    );
  }
);
