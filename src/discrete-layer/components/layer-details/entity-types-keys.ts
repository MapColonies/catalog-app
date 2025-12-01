/* eslint-disable @typescript-eslint/array-type */
/* eslint-disable @typescript-eslint/naming-convention */
import { 
  FieldConfigModelType,
  FieldConfigModel,
  Layer3DRecordModel,
  LayerRasterRecordModel,
  Layer3DRecordModelType,
  LayerRasterRecordModelType,
  LayerDemRecordModelType,
  LayerDemRecordModel,
  VectorBestRecordModelType,
  VectorBestRecordModel,
  QuantizedMeshBestRecordModelType,
  QuantizedMeshBestRecordModel,
  LayerMetadataMixedUnion
} from '../../models';

type KeysOfUnion<T> = T extends T ? keyof T : never;

export type LayerDemRecordModelArray = Array<keyof LayerDemRecordModelType>;
export type Layer3DRecordModelArray = Array<keyof Layer3DRecordModelType>;
export type LayerRasterRecordModelArray = Array<keyof LayerRasterRecordModelType>;
export type VectorBestRecordModelArray = Array<keyof VectorBestRecordModelType>;
export type QuantizedMeshBestRecordModelArray = Array<keyof QuantizedMeshBestRecordModelType>;
export type FieldConfigModelArray = Array<keyof FieldConfigModelType>;

export const LayerDemRecordModelKeys: LayerDemRecordModelArray = Object.keys(LayerDemRecordModel.properties) as LayerDemRecordModelArray;

export const Layer3DRecordModelKeys: Layer3DRecordModelArray = Object.keys(Layer3DRecordModel.properties) as Layer3DRecordModelArray;

export const LayerRasterRecordModelKeys: LayerRasterRecordModelArray = Object.keys(LayerRasterRecordModel.properties) as LayerRasterRecordModelArray;

export const VectorBestRecordModelKeys: VectorBestRecordModelArray = Object.keys(VectorBestRecordModel.properties) as VectorBestRecordModelArray;

export const QuantizedMeshBestRecordModelKeys: QuantizedMeshBestRecordModelArray = Object.keys(QuantizedMeshBestRecordModel.properties) as QuantizedMeshBestRecordModelArray;

export const FieldConfigModelKeys: FieldConfigModelArray = Object.keys(FieldConfigModel.properties) as FieldConfigModelArray;

// All fields from all entities.
export type LayerMetadataMixedUnionKeys = KeysOfUnion<LayerMetadataMixedUnion>;

export type LayerRecordTypes = "Layer3DRecord" | "LayerRasterRecord" | "LayerDemRecord" | "VectorBestRecord" | "QuantizedMeshBestRecord" | "PolygonPartRecord";

let tempLayerRecordTypesObject:
  | {
    [key in LayerRecordTypes]: undefined;
  }
  | undefined = {
    Layer3DRecord: undefined,
    LayerRasterRecord: undefined,
    LayerDemRecord: undefined,
    VectorBestRecord: undefined,
    QuantizedMeshBestRecord: undefined,
    PolygonPartRecord: undefined,
  };

export const LayerRecordTypesKeys = Object.keys(tempLayerRecordTypesObject);

export function filterByKeys<T extends object, U extends object>(
  source: T,
  reference: U
): Partial<T> {
  const allowedKeys = new Set(Object.keys(reference));
  return Object.fromEntries(
    Object.entries(source).filter(([key]) => allowedKeys.has(key))
  ) as Partial<T>;
}
