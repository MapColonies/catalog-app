import React, { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { observer } from 'mobx-react-lite';
import { Snackbar, SnackbarAction } from '@map-colonies/react-core';
import { ResponseState } from '../../../common/models/response-state.enum';
import { useStore } from '../../models/RootStore';

interface SnackDetails {
  message: string;
}

export const SnackContainer: React.FC = observer(() => {
  const { discreteLayersStore } = useStore();
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackDetails, setSnackDetails] = useState<SnackDetails>({
    message: '',
  });
  const intl = useIntl();
  useEffect(() => {
    switch (discreteLayersStore.state) {
      case ResponseState.ERROR:
        setSnackOpen(true);
        setSnackDetails({
          message: 'snack.message.failed',
        });
        break;
      case ResponseState.DONE:
        setSnackOpen(true);
        setSnackDetails({
          message: 'snack.message.success',
        });
        break;
      default:
        break;
    }
  }, [discreteLayersStore.state]);

  return (
    <>
      {!!snackDetails.message && (
        <Snackbar
          open={snackOpen}
          onClose={(): void => setSnackOpen(false)}
          message={intl.formatMessage({ id: snackDetails.message })}
          dismissesOnAction
          action={<SnackbarAction label={intl.formatMessage({ id: 'snack.dismiss-btn.text' })} />}
        />
      )}
    </>
  );
});
