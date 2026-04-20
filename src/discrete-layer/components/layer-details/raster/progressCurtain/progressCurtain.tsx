import { useIntl } from 'react-intl';
import { Icon, Typography } from '@map-colonies/react-core';
import { Box } from '@material-ui/core';
import { AutoDirectionBox } from '../../../../../common/components/auto-direction-box/auto-direction-box.component';
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
          let elapsedTime: number | undefined = 0;

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
        <Typography tag="span" className="titleIconSpacer"></Typography>
        <Typography tag="span" className="titleProcess">
          {intl.formatMessage({ id: 'progress.titleProcess' })}
        </Typography>
        <Box className="info">
          <Typography tag="span" className="titleProgress">
            {intl.formatMessage({ id: 'progress.titleProgress' })}
          </Typography>
          <Typography tag="span" className="titleTime">
            {intl.formatMessage({ id: 'progress.titleTime' })}
          </Typography>
        </Box>
      </Box>
      <Box className="rows">
        {rows.map((row) => {
          return (
            <Box key={row.key} className={`curtainRow ${row.state}`}>
              {getIconByType(row.type)}
              <Typography tag="span" className="processName">
                {intl.formatMessage({ id: row.label })}
              </Typography>
              <Box className="info">
                <AutoDirectionBox className="progress">{row.progress}</AutoDirectionBox>
                <AutoDirectionBox className="elapsedTime">{row.elapsedTime}</AutoDirectionBox>
              </Box>
            </Box>
          );
        })}
      </Box>
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
