import React from 'react';

import './hyperlink.css';

export const Hyperlink: React.FC<React.HTMLAttributes<HTMLAnchorElement> & { url: string, token?: string, label?: string }> = ({ url, token, label, ...props }): JSX.Element => {
  return (
    <a
      href={`${url}${token ?? ''}`}
      target="_blank" rel="noopener noreferrer"
      className='url'
      {...props}
    >
      {label ?? url}
    </a>
  );
};
