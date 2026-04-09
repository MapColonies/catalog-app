import { useIntl } from 'react-intl';
import { Box } from '@material-ui/core';
import { Descriptor, WorkerMessage } from '../worker/worker.types';

import './progressCurtain.css';

interface CurtainProps {
  descriptors: Descriptor;
  workerMessages?: Array<WorkerMessage> | null;
}

export const ProgressCurtain: React.FC<CurtainProps> = (props) => {
  const intl = useIntl();

  const messageMap = new Map(
    props.workerMessages?.map((m) => [`${m.process}-${m.stage}`, m]) ?? []
  );

  return (
    <Box id="progressCurtain">
      <Box className="curtainContent">
        {Object.entries(props.descriptors).flatMap(([processKey, processVal]) =>
          Object.entries(processVal.stages).map(([stageKey, stageVal]) => {
            const key = `${processKey}-${stageKey}`;
            const message = messageMap.get(key);

            if (!stageVal.isReportingOnProgress) {
              return undefined;
            }

            return (
              <Box key={key} className={`curtainRow ${message?.type === 'Done' ? 'inactive' : ''}`}>
                <span className="curtainLabel">
                  {intl.formatMessage({ id: stageVal.translationCode })}
                </span>

                <span className="curtainPercent">{message?.message ?? '0'}</span>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
};
