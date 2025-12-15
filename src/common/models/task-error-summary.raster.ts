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

export type RasterErrorCount = {
  count?: number;
  exceeded?: boolean;
}
