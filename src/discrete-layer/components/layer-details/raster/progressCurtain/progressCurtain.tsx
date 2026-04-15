import { useIntl } from 'react-intl';
import { IconButton } from '@map-colonies/react-core';
import { Box } from '@material-ui/core';
import { StagesInfo, WorkerMessage, WorkerType } from '../worker/worker.types';

import './progressCurtain.css';

interface CurtainProps {
  stagesInfo: StagesInfo;
  workerMessages?: WorkerMessage[] | null;
}

export const ProgressCurtain: React.FC<CurtainProps> = (props) => {
  const intl = useIntl();

  const messageMap = new Map(
    props.workerMessages?.map((m) => [`${m.process}-${m.stage}`, m]) ?? []
  );

  const IconType = (type: WorkerMessage['type'] | undefined): JSX.Element => {
    const defaultIcon = <IconButton className="mc-icon-Ellipse workerTypeStage" />;

    const iconMap = {
      [WorkerType.Error]: (
        <IconButton
          className="mc-icon-Close error workerTypeStage"
          style={{
            textAlign: 'start',
            fontWeight: 'bold',
          }}
        />
      ),
      [WorkerType.Done]: <IconButton className="mc-icon-Ok success workerTypeStage" />,
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

    const rows = Object.entries(props.stagesInfo).flatMap(([processKey, processVal]) =>
      Object.entries(processVal.stages).map(([stageKey, stageVal]) => {
        const key = `${processKey}-${stageKey}`;
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
        }
      }
      )).filter(row => row !== undefined);

    return { rows, errors };
  }

  const { rows, errors } = buildRows();

  return (
    <Box id="progressCurtain">
      <Box className="rows">
        {
          rows.map((row) => {
            return (
              <Box key={row.key} className={`curtainRow ${row.state}`}>
                {IconType(row.type)}
                <span className="processName">
                  {intl.formatMessage({ id: row.label })}
                </span>

                <Box className="info">
                  <bdi className="progress">{row.progress}</bdi>
                  <bdi className="elapsedTime">{row.elapsedTime}</bdi>
                </Box>
              </Box>
            );
          })
        }
      </Box>
      <Box className="errorsContainer error">
        {errors.length > 0 && (
          <>
            <IconButton className="mc-icon-Status-Warnings error" />
            <span>{errors}</span>
          </>
        )}
      </Box>
    </Box>
  );
};
