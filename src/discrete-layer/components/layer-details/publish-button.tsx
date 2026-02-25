import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { IconButton, Tooltip } from '@map-colonies/react-core';
import { isUnpublished } from '../../../common/helpers/style';
import { ILayerImage } from '../../models/layerImage';
import { PublishDialog } from './publish.dialog';

interface PublishButtonProps {
  layer: ILayerImage;
  className?: string;
}

export const PublishButton: React.FC<PublishButtonProps> = ({
  layer,
  className = '',
}) => {
  const intl = useIntl();
  const [unpublished, setUnpublished] = useState<boolean>(
    isUnpublished(layer as any)
  );
  const [icon, setIcon] = useState<string>(
    unpublished ? 'mc-icon-Publish' : 'mc-icon-Unpublish'
  );
  const [tooltip, setTooltip] = useState<string>(
    unpublished ? 'action.publish.tooltip' : 'action.unpublish.tooltip'
  );
  const [isDialogOpen, setDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    setUnpublished(isUnpublished(layer as any));
  }, [layer]);

  useEffect(() => {
    setIcon(unpublished ? 'mc-icon-Publish' : 'mc-icon-Unpublish');
    setTooltip(
      unpublished ? 'action.publish.tooltip' : 'action.unpublish.tooltip'
    );
  }, [unpublished]);

  return (
    <>
      <Tooltip content={intl.formatMessage({ id: tooltip })}>
        <IconButton
          className={`${className} ${icon}`}
          label="PUBLISH AND UNPUBLISH"
          onClick={(): void => {
            setDialogOpen(true);
          }}
        />
      </Tooltip>
      {isDialogOpen && (
        <PublishDialog
          layer={layer}
          isOpen={isDialogOpen}
          onSetOpen={setDialogOpen}
          onPublish={(): void => {
            setUnpublished(!unpublished);
          }}
        />
      )}
    </>
  );
};
