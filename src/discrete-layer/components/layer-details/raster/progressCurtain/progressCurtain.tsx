import { useIntl } from 'react-intl';
import { Icon } from '@map-colonies/react-core';
import { Box } from '@material-ui/core';
import { StagesInfo, WorkerMessage, WorkerType } from '../worker/worker.types';

import './progressCurtain.css';

interface CurtainProps {
  stagesInfo: StagesInfo;
  workerMessages?: WorkerMessage[] | null;
}

export const ProgressCurtain: React.FC<CurtainProps> = (props) => {
  const intl = useIntl();

  const getProcessStageKey = (processKey: string, stageKey: string) => {
    return `${processKey}-${stageKey}`;
  };

  const messageMap = new Map(
    props.workerMessages?.map((m) => [getProcessStageKey(m.process, m.stage), m]) ?? []
  );

  const getIconByType = (type: WorkerMessage['type'] | undefined): JSX.Element => {
    const defaultIcon = <Icon className="mc-icon-Ellipse icon" />;

    const iconMap = {
      [WorkerType.Error]: (
        <Icon
          className="mc-icon-Close error icon"
          style={{
            textAlign: 'start',
            fontWeight: 'bold',
          }}
        />
      ),
      [WorkerType.Done]: <Icon className="mc-icon-Ok success icon" />,
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

  const buildRows = () => {
    const errors: string[] = [];

    const rows = Object.entries(props.stagesInfo)
      .flatMap(([processKey, processVal]) =>
        Object.entries(processVal.stages).map(([stageKey, stageVal]) => {
          const key = getProcessStageKey(processKey, stageKey);
          const message = messageMap.get(key);

          if (!stageVal.shouldShowProgress) {
            return undefined;
          }

          let state = '';
          const type = message?.type;

          state = getStateByType(type);

          let progress: string | undefined = '—';
          let elapsedTime: string | undefined = '—';

          const rawMessage = message?.details;

          if (rawMessage) {
            progress = rawMessage.progress;
            elapsedTime = rawMessage.elapsedTime;
            if (rawMessage.error) {
              errors.push(rawMessage.error);
            }
          }

          return {
            key,
            type,
            state,
            label: stageVal.translationCode,
            progress,
            elapsedTime,
          };
        })
      )
      .filter((row) => row !== undefined);

    return { rows, errors };
  };

  const { rows, errors } = buildRows();

  return (
    <Box id="progressCurtain">
      <Box className="titles">
        <span className="titleIconSpacer" />
        <span className="titleProcess">{intl.formatMessage({ id: 'progress.titleProcess' })}</span>
        <Box className="info">
          <span className="titleProgress">
            {intl.formatMessage({ id: 'progress.titleProgress' })}
          </span>
          <span className="titleTime">{intl.formatMessage({ id: 'progress.titleTime' })}</span>
        </Box>
      </Box>
      <Box className="rows">
        {rows.map((row) => {
          return (
            <Box key={row.key} className={`curtainRow ${row.state}`}>
              {getIconByType(row.type)}
              <span className="processName">{intl.formatMessage({ id: row.label })}</span>

              <Box className="info">
                <bdi className="progress">{row.progress}</bdi>
                <bdi className="elapsedTime">{row.elapsedTime}</bdi>
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box className="errorsContainer error">
        {errors.length > 0 && (
          <>
            <Icon className="mc-icon-Status-Warnings error" />
            <span>{errors}</span>
          </>
        )}
      </Box>
    </Box>
  );
};
