import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Icon, Typography } from '@map-colonies/react-core';
import { Box } from '@material-ui/core';
import { AutoDirectionBox } from '../../../../../common/components/auto-direction-box/auto-direction-box.component';
import {
  Process,
  Stage,
  ProcessInfo,
  WorkerError,
  WorkerMessage,
  WorkerType,
} from '../worker/worker.types';

import './progressCurtain.css';

interface CurtainProps {
  stagesInfo: ProcessInfo;
  workerMessages?: WorkerMessage[] | null;
}

type RunProcess = {
  isDone: boolean;
  messages: Partial<Record<Stage, WorkerMessage>>;
};

type ProcessData = Record<Process, RunProcess[]>;

const initData = (stagesInfo: ProcessInfo): ProcessData =>
  Object.fromEntries(
    Object.entries(stagesInfo).map(([processKey, processVal]) => [
      processKey,
      Array.from({ length: processVal.runCount }, () => ({ isDone: false, messages: {} })),
    ])
  ) as ProcessData;

export const ProgressCurtain: React.FC<CurtainProps> = (props) => {
  const intl = useIntl();

  const [data, setData] = useState<ProcessData>(() => initData(props.stagesInfo));

  useEffect(() => {
    if (!props.workerMessages || props.workerMessages.length === 0) {
      return;
    }

    setData((prev) => {
      const newData = { ...prev };

      props.workerMessages!.forEach((message) => {
        const runningProcessesOfCertainType = newData[message.process];
        const activeIndex = runningProcessesOfCertainType.findIndex((entry) => !entry.isDone);
        if (activeIndex === -1) {
          return;
        }

        const processStages = Object.keys(props.stagesInfo[message.process].stages) as Stage[];

        // If it's the last stage, the Process will be marked as done.
        const isLastStage = processStages[processStages.length - 1] === message.stage;

        const runningProcess = runningProcessesOfCertainType[activeIndex];
        const newRunningProcesses = [...runningProcessesOfCertainType];
        newRunningProcesses[activeIndex] = {
          isDone: message.type === WorkerType.Done && isLastStage,
          messages: {
            ...runningProcess.messages,
            [message.stage]: message,
          },
        };

        newData[message.process] = newRunningProcesses;
      });

      return newData;
    });
  }, [props.workerMessages]);

  const getIconByType = (type: WorkerMessage['type'] | undefined): JSX.Element => {
    const defaultIcon = <Icon className="mc-icon-Ellipse" />;

    const iconMap = {
      [WorkerType.Error]: (
        <Icon
          className="mc-icon-Close error"
          style={{
            textAlign: 'start',
            fontWeight: 'bold',
          }}
        />
      ),
      [WorkerType.Done]: <Icon className="mc-icon-Ok success" />,
      [WorkerType.Progress]: defaultIcon,
    };

    return type ? iconMap[type] : defaultIcon;
  };

  const getStateByType = (type: WorkerMessage['type'] | undefined) => {
    const stateMap = {
      [WorkerType.Progress]: 'blink',
      [WorkerType.Done]: 'success',
      [WorkerType.Error]: 'error',
    };

    return type ? stateMap[type] : '';
  };

  const collectErrors = (messageDetails: WorkerError, errors: string[]) => {
    if (messageDetails.text) {
      errors.push(messageDetails.text);
    }

    if (messageDetails.code) {
      const message = messageDetails.codeParam
        ? intl.formatMessage({ id: messageDetails.code }, { value: messageDetails.codeParam })
        : intl.formatMessage({ id: messageDetails.code });

      errors.push(message);
    }
  };

  const buildRows = () => {
    const errors: string[] = [];

    const rows = (Object.entries(props.stagesInfo) as [Process, ProcessInfo[Process]][]).flatMap(
      ([processKey, processVal]) => {
        const runEntries = data[processKey] ?? [];

        return runEntries.flatMap((entry, runIndex) =>
          (
            Object.entries(processVal.stages) as [
              Stage,
              { translationCode: string; shouldShowProgress: boolean }
            ][]
          )
            .filter(([, stageVal]) => stageVal?.shouldShowProgress)
            .map(([stageKey, stageVal]) => {
              const message = entry.messages[stageKey];
              const type = message?.type;
              const state = getStateByType(type);

              let progress: string | undefined = '—';
              let elapsedTime: number | undefined = 0;

              if (message?.details) {
                progress = message.details.progress;
                elapsedTime = message.details.elapsedTime;

                if (message.details.error) {
                  collectErrors(message.details.error, errors);
                }
              }

              const runCount = runEntries.length;
              const runSuffix = runCount > 1 ? ` (${runIndex + 1}/${runCount})` : '';

              return {
                key: `${processKey}-${stageKey}-run-${runIndex}`,
                type,
                state,
                label: stageVal.translationCode,
                runSuffix,
                progress,
                elapsedTime,
              };
            })
        );
      }
    );

    return { rows, errors };
  };

  const { rows, errors } = buildRows();

  return (
    <Box id="progressCurtain">
      <table className="progressTable">
        <thead>
          <tr>
            <th className="colIcon" />
            <th className="colProcess">{intl.formatMessage({ id: 'progress.titleProcess' })}</th>
            <th className="colProgress">{intl.formatMessage({ id: 'progress.titleProgress' })}</th>
            <th className="colTime">{intl.formatMessage({ id: 'progress.titleTime' })}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className={`${row.state}`}>
              <td className="colIcon">{getIconByType(row.type)}</td>
              <td className="colProcess">
                {intl.formatMessage({ id: row.label })}
                {row.runSuffix}
              </td>
              <td className="colProgress">
                <AutoDirectionBox>{row.progress}</AutoDirectionBox>
              </td>
              <td className="colTime">
                <AutoDirectionBox>{row.elapsedTime}</AutoDirectionBox>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Box className="errorsContainer error">
        {errors.length > 0 && (
          <>
            <Icon className="mc-icon-Status-Warnings error" />
            <Typography tag="span">{errors}</Typography>
          </>
        )}
      </Box>
    </Box>
  );
};
