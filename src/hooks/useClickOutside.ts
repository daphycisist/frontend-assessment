import { useEffect, useRef } from 'react';

export const useClickOutside = <T extends HTMLElement>(
  callback: () => void
): React.RefObject<T> => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the clicked element is outside the referenced element
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    // Add event listener to document
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup event listener on unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [callback]);

  return ref;
}
