// RASTER GENERAL CONFIGURATION
import { RasterIngestionFilesTypeConfig } from "../../discrete-layer/models";

interface IRasterFileGroupConfig {
  allowedExt: string[];
  selectableExt: string[];
  relativeToAOIDirPath: string;
  producerFileName: string;
  selectablePattern: string;
}

export type IRasterIngestionFilesStructureConfig = Record<RasterIngestionFilesTypeConfig, IRasterFileGroupConfig>;