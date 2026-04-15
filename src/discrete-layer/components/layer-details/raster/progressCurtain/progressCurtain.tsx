import { useIntl } from 'react-intl';
import { Box } from '@material-ui/core';
import { Descriptor, Message, WorkerMessage } from '../worker/worker.types';

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

  const isMessageObject = (msg: Message | string | undefined): msg is Message => {
    return typeof msg === 'object' && msg !== null && 'progress' in msg;
  };

  return (
    <Box id="progressCurtain">
      {Object.entries(props.descriptors).flatMap(([processKey, processVal]) =>
        Object.entries(processVal.stages).map(([stageKey, stageVal]) => {
          const key = `${processKey}-${stageKey}`;
          const message = messageMap.get(key);

          if (!stageVal.isReportingOnProgress) {
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

          let progressText = '0%';
          let timeText = '0 (ms)';

          const rawMessage = message?.message;

          if (rawMessage) {
            if (isMessageObject(rawMessage)) {
              progressText = rawMessage.progress;
              timeText = rawMessage.timeItTookInMs;
            } else {
              progressText = rawMessage;
            }
          }

          return (
            <Box key={key} className={`curtainRow ${rowState}`}>
              <span>
                {intl.formatMessage({ id: stageVal.translationCode })}:
              </span>

              <div className="curtainVal">
                <bdi className="curtainPercent">
                  {progressText}
                </bdi>

                {/* {type === 'Done' && timeText && ( */}
                <bdi className="curtainTime">
                  {timeText}
                </bdi>
                {/* )} */}
              </div>
              {/* <button>String</button> */}
            </Box>
          );
        })
      )}
    </Box>
  );
};