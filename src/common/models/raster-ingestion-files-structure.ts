type RasterFileType = 'data' | 'product' | 'shapeMetadata';

interface IRasterFileGroup {
  allowedExt: string[];
  selectableExt: string[];
  relativeToAOIDirPath: string;
  producerFileName: string;
  selectablePattern: string;
}

export type IRasterIngestionFilesStructure = Record<RasterFileType, IRasterFileGroup>;