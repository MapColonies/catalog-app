import React,{useState, useEffect} from 'react';
import { useIntl } from 'react-intl';
import { Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { Copy } from '../../../../../common/components/copy/copy';

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
        <Typography className="failReasonText" tag="p">
          {failReason}
        </Typography>

        <Copy value={failReason}/>
      </Box>
    </td>
  );
};
