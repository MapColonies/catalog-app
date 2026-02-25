import React, { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FormattedMessage, useIntl } from 'react-intl';
import { Box } from '@map-colonies/react-components';
import { Button, Tooltip, Typography } from '@map-colonies/react-core';

const ExportLayerFinalStage: React.FC<{
  onClose: () => void;
  jobId: string;
}> = ({ onClose, jobId }) => {
  const intl = useIntl();
  const [hasCopied, setHasCopied] = useState(false);

  const textCopyTooltip = intl.formatMessage({
    id: hasCopied ? 'action.copied.tooltip' : 'action.copy.tooltip',
  });

  return (
    <Box className="exportLayerSuccessContainer">
      <Box className="mainTextContainer">
        <Typography className="jobIdTitle" tag="p">
          {intl.formatMessage({
            id: 'export-layer.exportSuccessContainer.jobId.title',
          })}
        </Typography>

        <Box onMouseLeave={(): void => setHasCopied(false)}>
          <Tooltip content={textCopyTooltip}>
            <CopyToClipboard
              text={jobId}
              onCopy={(): void => {
                setHasCopied(true);
              }}
            >
              <Typography className="jobIdText" tag="p">
                {jobId}
              </Typography>
            </CopyToClipboard>
          </Tooltip>
        </Box>
      </Box>

      <Box className="finalStageButtonsContainer">
        <CopyToClipboard text={jobId}>
          <Button id="copyAndApprove" raised type="button" onClick={onClose}>
            <FormattedMessage id="export-layer.exportSuccessContainer.approve" />
          </Button>
        </CopyToClipboard>
      </Box>
    </Box>
  );
};

export default ExportLayerFinalStage;
