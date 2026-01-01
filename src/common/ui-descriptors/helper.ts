import { UiDescriptorsTypeName, UiFieldDescriptor } from "./type";
import { LinkModelType } from "../../discrete-layer/models";
import { ILayerImage } from "../../discrete-layer/models/layerImage";

export const isUiDescriptor = (layerRecord?: ILayerImage | LinkModelType | null | UiFieldDescriptor): layerRecord is UiFieldDescriptor => {
  return layerRecord?.__typename === UiDescriptorsTypeName;
};