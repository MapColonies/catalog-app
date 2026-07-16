import { RecordType } from '../../models';
import { ILayerImage } from '../../models/layerImage';

export interface EntityDeleteDialogProps {
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
  layerRecord: ILayerImage;
  onSuccess?: () => void;
}
