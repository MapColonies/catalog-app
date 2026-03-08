import React, { PropsWithChildren } from 'react';

import './hyperlink.css';

export const Hyperlink: React.FC<
  PropsWithChildren<React.HTMLAttributes<HTMLAnchorElement>> & {
    url: string;
    token?: string;
    label?: string;
  }
> = ({ url, token, label, className, children, ...props }): JSX.Element => {
  return (
    <a
      href={`${url}${token ?? ''}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`url ${className ?? ''}`}
      {...props}
    >
      {children ?? label ?? url}
    </a>
  );
};
