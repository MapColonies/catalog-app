
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
  const count = (errorsSummary.errorsCount as Record<typeof key, number>)[key];
  const exceeded = (errorsSummary.thresholds as Record<typeof key, ErrorCount>)[key]?.exceeded;

  return {
    count,
    exceeded
  };
};