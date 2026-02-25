import { useState, useEffect, RefObject } from 'react';

const useIsEllipsisActive = (
  containerElement: RefObject<HTMLElement>
): boolean => {
  const [isEllipsisActive, setIsEllipsisActive] = useState(false);

  useEffect(() => {
    if (
      containerElement.current !== null &&
      containerElement.current.offsetWidth <
        containerElement.current.scrollWidth
    ) {
      setIsEllipsisActive(true);
    }
  }, [
    containerElement.current,
    containerElement.current?.innerText,
    containerElement.current?.innerHTML,
  ]);

  return isEllipsisActive;
};

export default useIsEllipsisActive;
