import { useEffect, useState } from 'react';
import { theme } from '@/ui/theme';
import { useIsClient } from './useIsClient';
import { useEventListenerOnMediaQuery } from './useEventListenerOnMediaQuery';

const useMatchBreakpoint = (breakpoint) => {
  const [matches, setMatches] = useState(false);
  const isClient = useIsClient();

  const handleChange = ({ matches }) => setMatches(matches);

  useEffect(() => {
    if (typeof window === 'undefined' || !breakpoint || !isClient) return;

    const mediaQuery = window.matchMedia(
      `(max-width: ${theme.breakpoints[breakpoint]}px)`,
    );

    useEventListenerOnMediaQuery(mediaQuery, 'change', handleChange);

    // call once for initial render (when opening the page in mobile view)
    handleChange(mediaQuery);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [breakpoint, isClient]);

  return matches;
};

export { useMatchBreakpoint };
