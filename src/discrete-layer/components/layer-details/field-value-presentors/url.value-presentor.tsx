import React from 'react';
import { Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { Copy } from '../../../../common/components/copy';
import { Hyperlink } from '../../../../common/components/hyperlink/hyperlink';
import TooltippedValue from '../../../../common/components/form/tooltipped.value';
import { ILink } from '../../../models/links';
import { getTokenParam } from '../../helpers/layersUtils';

import './url.value-presentor.css';

const COPY = 'copy';
const LINK = 'link';

interface UrlValuePresentorProps {
  value: string;
  linkInfo?: ILink;
}

export const UrlValuePresentorComponent: React.FC<UrlValuePresentorProps> = ({ value, linkInfo }) => {

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
          </Box>
        ) : (
          <Box className="detailsUrlFieldUrlCopy"></Box>
        )
      }
    </>
  );
}
