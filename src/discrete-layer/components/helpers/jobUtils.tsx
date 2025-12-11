
import { Box } from '@map-colonies/react-components';
import { FormattedMessage } from 'react-intl';

// TODO: use from @mapColonies/types and remove from here:
//#region to be removed
export type TaskParams = {
  isValid: boolean;
  errorsSummary: ErrorsSummary;
};

export type ErrorsSummary = {
  errorsCount: {
    geometryValidity: number;
    vertices: number;
    metadata: number;
    resolution: number;
    smallGeometries: number;
    smallHoles: number;
    unknown: number;
  };
  thresholds: {
    smallHoles: {
      exceeded: boolean;
      count: number;
    };
    smallGeometries: {
      exceeded: boolean;
    };
  }
};
//#endregion to be removed

type ErrorCount = {
  count?: number;
  exceeded?: boolean;
}

export const getErrorCount = (errorsSummary: ErrorsSummary | undefined, key: string): ErrorCount => {
  if (!errorsSummary) {
    return {};
  }
  const count = (errorsSummary.errorsCount as Record<string, number>)[key];
  const exceeded = (errorsSummary.thresholds as Record<string, ErrorCount>)[key]?.exceeded;

  return {
    count,
    exceeded
  };
};

export const ErrorsCountPresentor = (key: string, value: number, containerClassName: string, color: string) => {
  return (
    <Box key={key} className={containerClassName}>
      <Box style={{ color }}>
        <FormattedMessage id={`validationReport.${key}`} />
      </Box>

      <Box style={{ color }}>
        {value}
      </Box>
    </Box>
  );
};