import React,{useState, useEffect} from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useIntl } from 'react-intl';
import { IconButton, Tooltip, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';

import './job-details.fail-reason-area.css';

interface FailReasonAreaProps {
  failReason: string;
  show: boolean;
  key?: string;
}

export const FailReasonArea: React.FC<FailReasonAreaProps> = ({
  failReason,
  show,
  key = '',
}) => {
  const intl = useIntl();

  const [containerClass, setContainerClass] = useState('failReasonAreaContainer');

  useEffect(() => {
    setContainerClass(`failReasonAreaContainer ${show ? 'show' : ''}`);
  }, [show])


  return (
    <td colSpan={5}>
      <Box key={key} className={containerClass}>
        <Typography className={'failReasonText'} tag={'p'}>
          {failReason}
        </Typography>

        <Tooltip content={intl.formatMessage({ id: 'action.copy.tooltip' })}>
          <CopyToClipboard text={failReason}>
            <IconButton className="mc-icon-Copy" />
          </CopyToClipboard>
        </Tooltip>
      </Box>
    </td>
  );
};
