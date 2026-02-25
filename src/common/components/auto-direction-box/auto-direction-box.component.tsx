import {
  DetailedHTMLProps,
  HTMLAttributes,
  PropsWithChildren,
  forwardRef,
} from 'react';

export const AutoDirectionBox = forwardRef<
  HTMLElement,
  PropsWithChildren<DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>>
>((props, ref) => {
  return <bdi ref={ref} {...props} />;
});
