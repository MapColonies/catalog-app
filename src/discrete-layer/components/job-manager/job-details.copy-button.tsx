import { IconButton, Tooltip } from '@map-colonies/react-core';
import React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useIntl } from 'react-intl';
import { Copy } from '../../../common/components/copy';
const DEFAULT_ICON_SIZE = 20;

interface CopyButtonProps {
  text: string;
  iconSize?: number;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  iconSize = DEFAULT_ICON_SIZE,
}) => {
  const intl = useIntl();

  return (
    <Copy value={text}/>

    // <Tooltip content={intl.formatMessage({ id: 'action.copy.tooltip' })}>
    //   <CopyToClipboard text={text}>
    //     <IconButton
    //       type="button"
    //       style={{ fontSize: `${iconSize}px` }}
    //       className="mc-icon-Copy"
    //     />
    //   </CopyToClipboard>
    // </Tooltip>
  );
};
