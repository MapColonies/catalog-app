// RASTER GENERAL CONFIGURATION
import { RasterIngestionFilesTypeConfig } from '../../discrete-layer/models';

// FIELD selectablePattern can receive letters, and may optionally end with a '*' character,
// which acts as a wildcard to match any sequence of characters following the prefix in the file name.
interface IRasterFileGroupConfig {
  allowedExt: string[];
  selectableExt: string[];
  relativeToAOIDirPath: string;
  producerFileName: string;
  selectablePattern: string;
}

export type IRasterIngestionFilesStructureConfig = Record<RasterIngestionFilesTypeConfig, IRasterFileGroupConfig>;