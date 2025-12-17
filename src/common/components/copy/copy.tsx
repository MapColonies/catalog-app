import React, { ReactElement, useState } from 'react';
import { useIntl } from 'react-intl';
import CopyToClipboard from 'react-copy-to-clipboard';
import { IconButton } from '@map-colonies/react-core';

interface IProps {
    value: string;
    copyToClipboardChildren?: ReactElement;
    iconStyle?: React.CSSProperties;
}

export const Copy = (props: IProps) => {
    const intl = useIntl();
    const [isCopied, setIsCopied] = useState(false)

    return (
        <>
            <CopyToClipboard text={props.value} onCopy={(): void => setIsCopied(true)}>
                {props.copyToClipboardChildren ? props.copyToClipboardChildren :
                    <IconButton className="mc-icon-Copy" type="button" style={props.iconStyle} />}
            </CopyToClipboard>

        </>
    )
};