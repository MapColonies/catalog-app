import React from 'react';
import { useIntl } from 'react-intl';
import { IconButton } from '@map-colonies/react-core';
import { AutoDirectionBox } from '../auto-direction-box/auto-direction-box.component';
import {
  getGraphqlErrorItems,
  IGraphqlError,
} from '../../../discrete-layer/components/helpers/errorUtils';

import './error-presentor.css';

const NONE = 0;

export const GraphQLError: React.FC<{ error: IGraphqlError }> = ({ error }) => {
  const intl = useIntl();
  const errors = getGraphqlErrorItems([error].filter(Boolean), intl);

  if (errors.length === NONE) {
    return null;
  }

  return (
    <AutoDirectionBox className="errorContainer">
      <IconButton
        className="errorIcon mc-icon-Status-Warnings error"
        onClick={(e): void => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />
      <ul className="errorsList">
        {errors.map((err, index) => (
          <li
            dir="auto"
            key={index}
            className={err.level}
            dangerouslySetInnerHTML={{ __html: err.errText ?? '' }}
          ></li>
        ))}
      </ul>
    </AutoDirectionBox>
  );
};
