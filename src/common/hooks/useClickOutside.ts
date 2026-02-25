import { useCallback, useEffect } from 'react';

const LISTENER_DELAY = 200;

function isDescendant(parent: Node, child: Node) {
  let node = child.parentNode;
  let highestParentAvailableTag = '';
  if (node === null || child === parent) return true;

  while (node != null) {
    if (node === parent) {
      return true;
    }
    highestParentAvailableTag = node?.nodeName ?? '';
    node = node.parentNode;
  }

  if (node === null && highestParentAvailableTag !== '#document') {
    return true;
  }
  return false;
}

export const useClickOutside = <T extends HTMLElement>(
  ref: React.RefObject<T>,
  onClickOutside: (e: MouseEvent) => void,
  shouldHandle = true
) => {
  const clickHandler = useCallback((e: MouseEvent) => {
    if (ref.current) {
      if (!isDescendant(ref.current, e.target as Node)) {
        onClickOutside(e);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      document.removeEventListener('click', clickHandler);
    };
  }, []);

  useEffect(() => {
    if (!shouldHandle) {
      document.removeEventListener('click', clickHandler);
    } else {
      setTimeout(() => {
        document.addEventListener('click', clickHandler);
      }, LISTENER_DELAY);
    }
  }, [shouldHandle]);
};
