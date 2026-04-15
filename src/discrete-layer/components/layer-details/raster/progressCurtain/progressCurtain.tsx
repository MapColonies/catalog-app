import { useIntl } from 'react-intl';
import { IconButton } from '@map-colonies/react-core';
import { Box } from '@material-ui/core';
import { Descriptor, WorkerMessage, WorkerType } from '../worker/worker.types';

import './progressCurtain.css';

interface CurtainProps {
  descriptors: Descriptor;
  workerMessages?: WorkerMessage[] | null;
}

export const ProgressCurtain: React.FC<CurtainProps> = (props) => {
  const intl = useIntl();

  const messageMap = new Map(
    props.workerMessages?.map((m) => [`${m.process}-${m.stage}`, m]) ?? []
  );
  const errors: string[] = [];

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

  return (
    <Box id="progressCurtain">
      <Box className="rows">
        {Object.entries(props.descriptors).flatMap(([processKey, processVal]) =>
          Object.entries(processVal.stages).map(([stageKey, stageVal]) => {
            const key = `${processKey}-${stageKey}`;
            const message = messageMap.get(key);

            if (!stageVal.shouldShowProgress) {
              return undefined;
            }

            let rowState = '';
            const type = message?.type;

            if (type === 'Progress') {
              rowState = 'blink';
            } else if (type === 'Done') {
              rowState = 'success';
            } else if (type === 'Error') {
              rowState = 'error';
            }

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

            return (
              <Box key={key} className={`curtainRow ${rowState}`}>
                {IconType(type)}
                <span className="processName">
                  {intl.formatMessage({ id: stageVal.translationCode })}
                </span>

                <Box className="info">
                  <bdi className="progress">{progress}</bdi>
                  <bdi className="elapsedTime">{elapsedTime}</bdi>
                </Box>
              </Box>
            );
          })
        )}
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
