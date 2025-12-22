import React from 'react';
import { Box } from '@map-colonies/react-components';
import {
  CollapsibleList,
  SimpleListItem,
  Typography,
} from '@map-colonies/react-core';
import { FormattedMessage, useIntl } from 'react-intl';
import { Copy } from '../../../../../common/components/copy';
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
                  <Copy value={url as string}/>
                </Box>
              );
            })}
          </CollapsibleList>
        );
      })}
    </Box>
  );
};
