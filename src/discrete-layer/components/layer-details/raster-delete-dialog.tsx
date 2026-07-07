import React from 'react';
import { observer } from 'mobx-react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@map-colonies/react-core';
import { ILayerImage } from '../../models/layerImage';

interface RasterDeleteDialogProps {
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
  layerRecord: ILayerImage;
}

// Stub for Frontend Task 10 (dialog visibility wiring) - full implementation (identity/map/form/
// submit) lands in Frontend Task 11.
export const RasterDeleteDialog: React.FC<RasterDeleteDialogProps> = observer(
  (props: RasterDeleteDialogProps) => {
    const { isOpen, onSetOpen } = props;

    return (
      <Dialog open={isOpen} preventOutsideDismiss={true}>
        <DialogTitle>Delete raster layer</DialogTitle>
        <DialogContent></DialogContent>
        <DialogActions>
          <Button onClick={(): void => onSetOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }
);
