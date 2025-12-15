/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { cloneDeep, isEmpty } from 'lodash';
import { observer } from 'mobx-react';
import moment from 'moment';
import { DialogContent } from '@material-ui/core';
import { Button, Dialog, DialogTitle, IconButton } from '@map-colonies/react-core';
import { Box, DateTimeRangePicker, SupportedLocales } from '@map-colonies/react-components';
import { IActionGroup } from '../../../common/actions/entity.actions';
import { GraphQLError } from '../../../common/components/error/graphql.error-presentor';
import { LogicError } from '../../../common/components/error/logic.error-presentor';
import { GridApi, IFocusError } from '../../../common/components/grid';
import CONFIG from '../../../common/config';
import { dateFormatter } from '../../../common/helpers/formatters';
import useCountDown, { IActions } from '../../../common/hooks/countdown.hook';
import useDateNow from '../../../common/hooks/useDateNow.hook';
import { JobModelType } from '../../models';
import { IDispatchAction } from '../../models/actionDispatcherStore';
import { useQuery, useStore } from '../../models/RootStore';
import { downloadJSONToClient } from '../layer-details/utils';
import JobManagerGrid from './grids/job-manager-grid.common';
import { JOB_ENTITY } from './job.types';

import './jobs.dialog.css';

const START_CYCLE_ITERATION = 0;
const POLLING_CYCLE_INTERVAL = CONFIG.JOB_MANAGER.POLLING_CYCLE_INTERVAL;
const COUNTDOWN_REFRESH_RATE = 1000; // interval to change remaining time amount, defaults to 1000
const MILLISECONDS_IN_SEC = 1000;

interface JobsDialogProps {
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
  setRestoreFromJob: (job: JobModelType) => void;
  focusOnJob?: JobModelType;
  setFocusOnJob?: (job: JobModelType | undefined) => void;
}

export const JobsDialog: React.FC<JobsDialogProps> = observer((props: JobsDialogProps) => {
  const store = useStore();
  const intl = useIntl();
  const { isOpen, onSetOpen, setRestoreFromJob, focusOnJob, setFocusOnJob } = props;
  const [ updateTaskPayload, setUpdateTaskPayload ] = useState<Record<string, unknown>>({});
  const [ gridRowData, setGridRowData ] = useState<JobModelType[] | undefined>(undefined);
  const [ gridApi, setGridApi ] = useState<GridApi>();
  const [ pollingCycle, setPollingCycle ] = useState(START_CYCLE_ITERATION);
  const [ fromDate, setFromDate ] = useState<Date>(moment().subtract(CONFIG.JOB_MANAGER.FILTER_DAYS_TIME_SLOT, 'days').toDate());
  const [handleFocusError, setHandleFocusError] = useState<IFocusError | undefined>(undefined);

  // @ts-ignore
  const [ timeLeft, actions ] = useCountDown(POLLING_CYCLE_INTERVAL, COUNTDOWN_REFRESH_RATE);

  const tillDate = useDateNow().current;

  // start the timer during the first render
  useEffect(() => {
    (actions as IActions).start();
  }, []);

  // eslint-disable-next-line
  const { setQuery, loading, error, data, query } = useQuery((store) =>
    store.queryJobs({
      params: {
        fromDate,
        tillDate
      }
    }),
    {
      fetchPolicy: 'no-cache'
    }
  );

  //@ts-ignore
  const { setQuery: setQueryForOneJob, data: jobData, loading: loadingJobData } = useQuery<Record<any, any>>((store) =>
    undefined,
    {
      fetchPolicy: 'no-cache'
    }
  );

  const mutationQuery = useQuery();

  const getJobActions = useMemo(() => {
    let actions: IActionGroup[] = store.actionDispatcherStore.getEntityActionGroups(
      JOB_ENTITY
    );

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
    setQuery(
      (store) =>
        store.queryJobs({
          params: {
            fromDate,
            tillDate,
          },
        })
    );
  }, [fromDate, setQuery]);

  // const getFilterJobsPredicate = (requestedDomain: RecordType): ((cur: JobModelType) => boolean) => {
  //   return (cur: JobModelType): boolean => {
  //     const jobDomain = enumsMap?.[cur.productType as string]?.parentDomain;
  //     return jobDomain === requestedDomain;
  //   }
  // }

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
            tillDate: new Date(tillDate.getTime() + Number(POLLING_CYCLE_INTERVAL)),
          },
        }));
    }
  }, [mutationQuery.data]);

  useEffect(() => {
    if (updateTaskPayload.id !== undefined) {
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      mutationQuery.setQuery(store.mutateUpdateJob(updateTaskPayload, () => { }));
    }
  }, [updateTaskPayload]);

  useEffect(() => {
    if (!isEmpty(mutationQuery.error)) {
      gridApi?.refreshCells({
        suppressFlash: true,
        force: true
      });
    }
  }, [mutationQuery.error]);

  useEffect(() => {
    const pollingInterval = setInterval(() => {
      setPollingCycle(pollingCycle + 1);
      const bufferedRequestedTime = new Date(tillDate.getTime() + Number(POLLING_CYCLE_INTERVAL));
      (actions as IActions).start(POLLING_CYCLE_INTERVAL);
      setQuery((store) =>
        store.queryJobs({
          params: {
            fromDate,
            tillDate: bufferedRequestedTime,
          },
        }));
    }, POLLING_CYCLE_INTERVAL);

    return (): void => {
      clearInterval(pollingInterval);
    };
  }, [query, pollingCycle]);

  useEffect(() => {
    if (!loadingJobData && jobData) {
      downloadJSONToClient(jobData.job, `${encodeURI(jobData.job.resourceId as string)}_job_details.json`);
    }
  }, [jobData, loadingJobData]);

  const closeDialog = useCallback(() => {
    setFocusOnJob?.(undefined);
    onSetOpen(false);
  }, [onSetOpen]);

  const dispatchAction = (action: Record<string, unknown> | undefined): void => {
    const actionToDispatch = (action ? { action: action.action, data: action.data } : action) as IDispatchAction;
    store.actionDispatcherStore.dispatchAction(
      actionToDispatch
    );
  };

  // Job actions handler

  useEffect(() => {
    if (typeof store.actionDispatcherStore.action !== 'undefined') {
      const { action, data } = store.actionDispatcherStore.action as IDispatchAction;
      switch (action) {
        case 'Job.retry':
          mutationQuery.setQuery(
            store.mutateJobRetry({'jobRetryParams': {
              id: data.id as string,
              domain: data.domain as string,
            }})
          );
          break;
        case 'Job.abort': {
          mutationQuery.setQuery(
            store.mutateJobAbort({'jobAbortParams': {
              id: data.id as string,
              domain: data.domain as string,
            }})
          );
          break;
        }
        case 'Job.download_details':
          setQueryForOneJob((store) =>
            store.queryJob({
              id: data.id as string
            }));
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
      dispatchAction(undefined)
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
            setGridApi(params.api)
          }}
          updateJobCB={setUpdateTaskPayload}
          rowDataChangeCB={(): void => { }}
          areJobsLoading={loading}
          focusOnJob={focusOnJob}
          setFocusOnJob={setFocusOnJob}
          handleFocusError={(error) => {
            setHandleFocusError(error);
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
          onChange={(dateRange): void => {
            if (
              typeof dateRange.from !== 'undefined' &&
              typeof dateRange.to !== 'undefined'
            ) {
              setFromDate(dateRange.from);
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
          {!error && renderGridList()}
          {
            (mutationQuery.error !== undefined || error) && (
              // eslint-disable-next-line
              <Box className={`${error ? 'render-jobs-data-error' : ''}`}>
                <GraphQLError error={mutationQuery.error || error} />
              </Box>
            )
          }
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

            {
              handleFocusError && handleFocusError.code && focusOnJob &&
              <Box className="messages">
                <LogicError errors={[{
                  code: handleFocusError.code,
                  message: `${focusOnJob.resourceId} <bdi>(${dateFormatter(focusOnJob.updated, true)})</bdi>`,
                  level: 'warning'
                }]} />
              </Box>
            }
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
});
