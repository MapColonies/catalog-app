import React from 'react';
import { Box } from '@map-colonies/react-components';
import {
  CollapsibleList,
  IconButton,
  SimpleListItem,
  Tooltip,
  Typography,
} from '@map-colonies/react-core';
import CopyToClipboard from 'react-copy-to-clipboard';
import { FormattedMessage, useIntl } from 'react-intl';
import { CategorizedServices } from '../system-core-info.dialog';
import './external-services.css';

interface ExternalServicesProps {
  services: CategorizedServices;
}

export const ExternalServices: React.FC<ExternalServicesProps> = ({
  services,
}: ExternalServicesProps) => {
  const intl = useIntl();

  return (
    <Box className="listsContainer">
      {Object.entries(services).map(([category, services]) => {
        return (
          <CollapsibleList
            handle={
              <SimpleListItem
                text={category}
                metaIcon="chevron_right"
              />
            }
          >
            {(services ?? []).map(({ url, display }) => {
              return (
                <Box className="externalService">
                  <Typography className="displayName" tag="p">
                    <FormattedMessage id={display} />
                  </Typography>

                  <Typography className="urlText" tag="p">
                    {`${url as string}`}
                  </Typography>

                  <Tooltip
                    content={intl.formatMessage({
                      id: 'action.copy-url.tooltip',
                    })}
                  >
                    <CopyToClipboard text={url as string}>
                      <IconButton className="mc-icon-Copy" type="button"/>
                    </CopyToClipboard>
                  </Tooltip>
                </Box>
              );
            })}
          </CollapsibleList>
        );
      })}
    </Box>
  );
};
