// This enum also declared in the BFF, the reason for this
// dupplication is that we want to maintain this code as internal code for APP and for BFF

export enum Domain {
  RASTER = 'RASTER',
  '3D' = '3D',
  DEM = 'DEM',
  VECTOR = 'VECTOR',
}
