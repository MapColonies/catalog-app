import React, { ReactElement, useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { IconButton } from '@map-colonies/react-core';
import { Box } from '@material-ui/core';
import CONFIG from '../../../common/config';

import './style.css';

interface IProps {
  value: string;
  copyToClipboardChildren?: ReactElement;
  iconStyle?: React.CSSProperties;
}

export const Copy = (props: IProps) => {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    isCopied && setTimeout(setIsCopied, 1500, false)
  }, [isCopied])

  return (
    <>
      <CopyToClipboard text={props.value} onCopy={(): void => setIsCopied(true)}>
        <Box className={`icon-wrapper`}>
          {props.copyToClipboardChildren ?
            props.copyToClipboardChildren :
            <IconButton
              type="button"
              className={"mc-icon-Copy"}
              onChange={(): void => {
                setIsCopied(true)
              }}
              label={isCopied ? 'Success' : 'Copy'}
            />}

          {isCopied && <IconButton
            className={`mc-icon-Ok`}
            style={{ color: "var(--mdc-theme-gc-success)" }}
          />}

        </Box>
      </CopyToClipboard>
    </>
  )
};
