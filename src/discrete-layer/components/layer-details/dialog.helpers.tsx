import { useIntl } from 'react-intl';
import { Mode } from '../../../common/models/mode.enum';
import { DialogTitle, DialogTitleProps, IconButton } from '@map-colonies/react-core';

export interface DeleteTitleProps extends DialogTitleProps {
  domain: string;
  action: Mode;
  onClose: () => void;
}

export const DialogActionTitle: React.FC<DeleteTitleProps> = ({
  action,
  domain,
  onClose,
  ...dialogTitleProps
}) => {
  const intl = useIntl();
  const title = intl.formatMessage(
    { id: `general.title.${action.toLowerCase()}` },
    { value: domain }
  );

  return (
    <DialogTitle {...dialogTitleProps}>
      {title}
      <IconButton
        className="closeIcon mc-icon-Close"
        label="CLOSE"
        onClick={(): void => {
          onClose();
        }}
      />
    </DialogTitle>
  );
};
