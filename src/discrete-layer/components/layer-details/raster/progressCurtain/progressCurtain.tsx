import { useIntl } from 'react-intl';
import { Icon, Typography } from '@map-colonies/react-core';
import { Box } from '@material-ui/core';
import { AutoDirectionBox } from '../../../../../common/components/auto-direction-box/auto-direction-box.component';
import { StagesInfo, WorkerError, WorkerMessage, WorkerType } from '../worker/worker.types';

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
              collectErrors(rawMessage.error, errors);
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
              <td className="colProcess">{intl.formatMessage({ id: row.label })}</td>
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
