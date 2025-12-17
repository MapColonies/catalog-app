import React, { useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useIntl } from 'react-intl';
import { IconButton, Tooltip, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { Hyperlink } from '../../../../common/components/hyperlink/hyperlink';
import TooltippedValue from '../../../../common/components/form/tooltipped.value';
import { ILink } from '../../../models/links';
import { getTokenParam } from '../../helpers/layersUtils';

import './url.value-presentor.css';
import { Copy } from '../../../../common/components/copy';

const COPY = 'copy';
const LINK = 'link';

interface UrlValuePresentorProps {
  value: string;
  linkInfo?: ILink;
}

export const UrlValuePresentorComponent: React.FC<UrlValuePresentorProps> = ({ value, linkInfo }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [copied, setCopied] = useState<boolean>(false);
  const intl = useIntl();

  // Render COPY action for unknown link types also.
  return (
    <>
      <TooltippedValue
        className="detailsFieldValue detailsUrlFieldValue"
        customTooltipText={value}
      >
        {linkInfo?.linkAction === LINK ? (
          <Hyperlink url={value} token={getTokenParam()} />
        ) : (
          <Typography tag="span">{value}</Typography>
        )}
      </TooltippedValue>

      {
        !linkInfo || linkInfo.linkAction === COPY ? (
          <Box className="detailsUrlFieldUrlCopy">
            <Copy value={value}/>
            
            {/* <Tooltip content={intl.formatMessage({ id: 'action.copy-url.tooltip' })} >
              <CopyToClipboard text={value} onCopy={(): void => setCopied(true)}>
                <IconButton type="button" className="mc-icon-Copy" />
              </CopyToClipboard>
            </Tooltip> */}
          </Box>
        ) : (
          <Box className="detailsUrlFieldUrlCopy"></Box>
        )
      }
    </>
  );
}
