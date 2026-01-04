import { LinkModelType } from '../../discrete-layer/models';
import { ILayerImage } from '../../discrete-layer/models/layerImage';
import { UiDescriptorsTypeName, UiFieldDescriptor } from './type';

export const isUiDescriptor = (layerRecord?: ILayerImage | LinkModelType | null | UiFieldDescriptor): layerRecord is UiFieldDescriptor => {
  return layerRecord?.__typename === UiDescriptorsTypeName;
};
