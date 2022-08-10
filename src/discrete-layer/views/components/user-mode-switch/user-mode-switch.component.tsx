import React, { useState, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Switch } from '@material-ui/core';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  // Switch, // Doesn't work for some reason
  TextField,
  Typography,
} from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import CONFIG from '../../../../common/config'
import { UserRole } from '../../../models/userStore';

import './user-mode-switch.component.css';

const ADMIN_PASSWORD = CONFIG.ADMIN_PASSWORD as string;
interface UserModeSwitchProps {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
}

const UserModeSwitch: React.FC<UserModeSwitchProps> = ({ userRole, setUserRole }) => {
  const intl = useIntl();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(true);

  const resetDialogState = useCallback((): void => {
    setPassword('');
    setIsPasswordValid(true);
  }, []);

  const getIsChecked = (): boolean => {
    return userRole === UserRole.ADMIN;
  };

  const handleSwitchClick = (): void => {
    if (userRole === UserRole.USER){
      setIsDialogOpen(!isDialogOpen);
    } else {
      setUserRole(UserRole.USER);
    }
  };

  const closeDialog = useCallback((): void => {
    resetDialogState();
    setIsDialogOpen(false);
  }, []);

  const validatePassword = useCallback((): void => {
    const isValid = password === ADMIN_PASSWORD;
    setIsPasswordValid(isValid);
    if (isValid) {
      setUserRole(UserRole.ADMIN);
      closeDialog();
    }
  }, [password]);


  const renderInputErrorMsg = useCallback((): JSX.Element => {
    return (
      <Box className="passwordError">
        {!isPasswordValid && (
          <Typography tag="p" style={{ color: 'red' }}>
            <FormattedMessage id="user-role.dialog.wrong-password-error.text" />
          </Typography>
        )}
      </Box>
    );
  }, [isPasswordValid]);

  const renderDialogContent = (): JSX.Element => {
    return (
      <Box className="dialogContentContainer">
        <Box className="passwordInputContainer">
          <TextField
            invalid={!isPasswordValid}
            className="passwordInput"
            label={intl.formatMessage({
              id: 'user-role.dialog.password.input.placeholder',
            })}
            type="password"
            onChange={(e: React.FormEvent<HTMLInputElement>): void => {
              setPassword(e.currentTarget.value.trim());
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>): void => {
              const SUBMIT_KEY = 'Enter'
              if (password && e.key === SUBMIT_KEY) {
                validatePassword();
              }
            }}
            value={password}
          />
        </Box>
        {renderInputErrorMsg()}
      </Box>
    );
  };

  return (
    <Box className="switchContainer">
      <Typography tag="p">
        <FormattedMessage id="user-role.switch.user.text" />
      </Typography>

      <Switch checked={getIsChecked()} onClick={handleSwitchClick} />

      <Typography tag="p">
        <FormattedMessage id="user-role.switch.admin.text" />
      </Typography>

      <Dialog
        className="userModeSwitchDialog"
        open={isDialogOpen}
        preventOutsideDismiss={true}
      >
        <DialogTitle>
          <FormattedMessage id="user-role.dialog.title.text" />

          <IconButton
            className="closeIcon mc-icon-Close"
            onClick={closeDialog}
          />
        </DialogTitle>

        <DialogContent className="userModeSwitchDialogContent">
          {renderDialogContent()}
        </DialogContent>
        <Button
          raised
          className="switchBtn"
          type="button"
          disabled={!password}
          onClick={validatePassword}
        >
          <FormattedMessage id="user-role.dialog.switch-to-admin.btn.text" />
        </Button>
      </Dialog>
    </Box>
  );
};

export default UserModeSwitch;
