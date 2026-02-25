/* eslint-disable @typescript-eslint/naming-convention */
import React from 'react';
import { useEffect, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

interface UseStaticHTMLProps<T> {
  FunctionalComp: React.FunctionComponent<T>;
  props: T;
}

function useStaticHTML<T>({
  FunctionalComp,
  props,
}: UseStaticHTMLProps<T>): string {
  const [html, setHTML] = useState<string>('');

  useEffect(() => {
    // @ts-ignore
    const htmlString = renderToStaticMarkup(
      React.createElement(FunctionalComp, { ...props })
    );
    setHTML(htmlString);
  }, [FunctionalComp, props]);

  return html;
}

export default useStaticHTML;
