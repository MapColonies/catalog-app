import { LinkModelType } from "../../discrete-layer/models";
import { ILayerImage } from "../../discrete-layer/models/layerImage";
import { resolutionDegree } from "./resolution/resolutionDegree";
import { resolutionMeter } from "./resolution/resolutionMeter";
import { UiDescriptorsTypeName, UiFieldDescriptor } from "./type";

export const uidescriptorFielsdName = [resolutionDegree, resolutionMeter];


export const isUiDescriptor = (layerRecord?: ILayerImage | LinkModelType | null | UiFieldDescriptor): layerRecord is UiFieldDescriptor => {
  return layerRecord?.__typename === UiDescriptorsTypeName;
};