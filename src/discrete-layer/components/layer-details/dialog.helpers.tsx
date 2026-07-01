import { useIntl } from 'react-intl';
import { Mode } from '../../../common/models/mode.enum';
import { DialogTitle, IconButton } from '@map-colonies/react-core';

export interface DeleteTitleProps {
  domain: string;
  action: Mode;
  onClose: () => void;
}

export const DialogActionTitle: React.FC<DeleteTitleProps> = (props) => {
  const intl = useIntl();
  const title = intl.formatMessage(
    { id: `general.title.${props.action.toLowerCase()}` },
    { value: props.domain }
  );

  return (
    <DialogTitle>
      {title}
      <IconButton
        className="closeIcon mc-icon-Close"
        label="CLOSE"
        onClick={(): void => {
          props.onClose();
        }}
      />
    </DialogTitle>
  );
};
