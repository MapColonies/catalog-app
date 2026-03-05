import React from 'react';
import { Box } from '@map-colonies/react-components';
import { Typography, useTheme } from '@map-colonies/react-core';
import { DeploymentWithServicesModelType } from '../../../../models';

import './internal-service.css';

interface InternalServiceProps {
  service: DeploymentWithServicesModelType;
}

interface Services {
  name: string;
  uid: string;
  addresses: string[];
}

export const InternalService: React.FC<InternalServiceProps> = ({
  service: { image, services, status },
}: InternalServiceProps) => {
  const theme = useTheme();

  const svcList = (services as Services[] | undefined)?.map((service) => {
    return (
      <Box className="internalService">
        <Box
          className="statusIndicator"
          style={{
            backgroundColor: `${
              (status as boolean)
                ? (theme.custom?.GC_SUCCESS as string)
                : (theme.custom?.GC_ERROR_HIGH as string)
            }`,
          }}
        />
        <Typography className="serviceName" tag="p">
          {`${service.name}`}
        </Typography>
        <Typography className="serviceVersion" tag="p">
          {(image as string).split(':')[1]}
        </Typography>
      </Box>
    );
  });

  return <>{svcList}</>;
};
