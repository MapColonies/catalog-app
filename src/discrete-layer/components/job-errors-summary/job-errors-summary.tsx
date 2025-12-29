import { FormattedMessage } from 'react-intl';
import { IOptions } from '@map-colonies/react-core';
import { Box } from '@material-ui/core';
import { RasterErrorCount, RasterErrorsSummary } from '../../../common/models/job-errors-summary.raster';

interface ErrorCountProps {
  name: string;
  value: number;
  className: string;
  color?: string
}

const ErrorCount = ({ name, value, className, color }: ErrorCountProps): JSX.Element => {
  return (
    <Box className={className}>
      <Box style={{ color }}>
        <FormattedMessage id={`validationReport.${name}`} />
      </Box>
      <Box style={{ color }}>
        {value}
      </Box>
    </Box>
  );
};

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

export const JobErrorsSummary = (theme: IOptions, errorsSummary: RasterErrorsSummary | undefined, className: string, overrideColor?: string): JSX.Element[] | undefined => {
  if (!errorsSummary) {
    return;
  }
  return Object.entries(errorsSummary.errorsCount).map(([key, value]) => {
    let color = overrideColor;
    if (!overrideColor) {
      color = value === 0
        ? theme.custom?.GC_SUCCESS
        : getRasterErrorCount(errorsSummary, key)?.exceeded === false
          ? theme.custom?.GC_WARNING_HIGH
          : theme.custom?.GC_ERROR_HIGH;
    }
    return <ErrorCount key={key} name={key} value={value} className={className} color={color} />;
  });
};
