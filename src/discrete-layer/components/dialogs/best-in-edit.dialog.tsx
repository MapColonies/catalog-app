import React, { useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { DialogContent } from '@material-ui/core';
import { Button, Dialog, DialogActions, DialogTitle, IconButton } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';

import './best-in-edit.dialog.css';

interface BestInEditDialogProps {
  isOpen: boolean;
  onSetOpen: (open: boolean) => void;
}

export const BestInEditDialog: React.FC<BestInEditDialogProps> = ({ isOpen, onSetOpen }) => {
  const closeDialog = useCallback(
    () => {
      onSetOpen(false);
    },
    [onSetOpen]
  );

  return (
    <Box id="bestInEditDialog">
      <Dialog open={isOpen} preventOutsideDismiss={true}>
        <DialogTitle>
          <FormattedMessage id="general.dialog.best-in-edit.title"/>
          <IconButton
            className="closeIcon mc-icon-Close"
            label="CLOSE"
            onClick={ (): void => { closeDialog(); } }
          />
        </DialogTitle>
        <DialogContent className="dialogBody">
          <Box>
            <FormattedMessage id="general.dialog.best-in-edit.message"/>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button raised type="button" onClick={(): void => { closeDialog(); }}>
            <FormattedMessage id="general.ok-btn.text"/>
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
