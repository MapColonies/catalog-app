
import { Box } from '@map-colonies/react-components';
import { IOptions } from '@map-colonies/react-core';
import { FormattedMessage } from 'react-intl';

// TODO: use from @mapColonies/types and remove from here:
//#region to be removed
export type RasterTaskParams = {
  isValid: boolean;
  errorsSummary: RasterErrorsSummary;
};

export type RasterErrorsSummary = {
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

type RasterErrorCount = {
  count?: number;
  exceeded?: boolean;
}

export const getRasterErrorCount = (errorsSummary: RasterErrorsSummary | undefined, key: string): RasterErrorCount => {
  if (!errorsSummary) {
    return {};
  }
  const count = (errorsSummary.errorsCount as Record<string, number>)[key];
  const exceeded = (errorsSummary.thresholds as Record<string, RasterErrorCount>)[key]?.exceeded;

  return {
    count,
    exceeded
  };
};

const errorsCountPresentor = (key: string, value: number, containerClassName: string, color: string): JSX.Element => {
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

export const RenderErrorCounts = (theme: IOptions, errorsSummary: RasterErrorsSummary | undefined, className: string): JSX.Element[] | undefined => {
  if (!errorsSummary) {
    return;
  }

  return Object.entries(errorsSummary.errorsCount).map(([key, value]) => {
    const color =
      value === 0
        ? theme.custom?.GC_SUCCESS
        : getRasterErrorCount(errorsSummary, key)?.exceeded === false
          ? theme.custom?.GC_WARNING_HIGH
          : theme.custom?.GC_ERROR_HIGH
    return errorsCountPresentor(key, value, className, color);
  })
};