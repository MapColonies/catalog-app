import { useIntl } from 'react-intl';
import { DialogTitle, DialogTitleProps, IconButton } from '@map-colonies/react-core';
import { Mode } from '../../../common/models/mode.enum';
import { RecordType } from '../../models';

interface DialogActionTitleProps extends DialogTitleProps {
  recordType: RecordType;
  action: Mode;
  onClose: () => void;
}

export const DialogActionTitle: React.FC<DialogActionTitleProps> = ({
  action,
  recordType,
  onClose,
  ...dialogTitleProps
}) => {
  const intl = useIntl();

  const domain = intl.formatMessage({
    id: `record-type.${(recordType as string).toLowerCase()}.label`,
  });

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
