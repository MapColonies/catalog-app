import React, { PropsWithChildren } from 'react';

export const CesiumInfoBoxContainer: React.FC<
  PropsWithChildren<{ theme: Record<string, string> }>
> = (props) => {
  return (
    <div
      style={{ backgroundColor: props.theme.surface, width: '100%' }}
      className="MCCesiumInfoBox"
    >
      {props.children}
    </div>
  );
};
