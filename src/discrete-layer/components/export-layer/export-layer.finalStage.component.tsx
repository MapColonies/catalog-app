import { Box } from '@map-colonies/react-components';
import { Button, Typography } from '@map-colonies/react-core';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Copy } from '../../../common/components/copy';

const ExportLayerFinalStage: React.FC<{
  onClose: () => void;
  jobId: string;

}> = ({ onClose, jobId }) => {

  const intl = useIntl();

  return (
    <Box className="exportLayerSuccessContainer">
      <Box className="mainTextContainer">
        <Typography className="jobIdTitle" tag="p">
          {intl.formatMessage({
            id: 'export-layer.exportSuccessContainer.jobId.title',
          })}
        </Typography>

        <Box>
          <Copy value={jobId} />
        </Box>
      </Box>

      <Box className="finalStageButtonsContainer">
        <Copy value={jobId}
          copyToClipboardChildren={
            <Button
              id="copyAndApprove"
              raised
              type="button"
              onClick={onClose}
            >
              <FormattedMessage id="export-layer.exportSuccessContainer.approve" />
            </Button>
          }
        ></Copy>
      </Box>
    </Box>
  );
};

export default ExportLayerFinalStage;
