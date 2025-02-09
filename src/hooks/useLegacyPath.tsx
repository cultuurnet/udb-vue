import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';

import { useCookiesWithOptions } from './useCookiesWithOptions';
import { useSearchParams } from './useSearchParams';

const useLegacyPath = () => {
  const { cookies } = useCookiesWithOptions(['token', 'udb-language']);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { publicRuntimeConfig } = getConfig();
  const prefixWhenNotEmpty = (value, prefix) =>
    value ? `${prefix}${value}` : value;

  const jwt = cookies.token;
  const lang = cookies['udb-language'];

  const legacyPath = useMemo(() => {
    const path = new URL(router.asPath, publicRuntimeConfig.legacyAppUrl)
      .pathname;
    searchParams.set('jwt', jwt);
    searchParams.set('lang', lang);

    return `${publicRuntimeConfig.legacyAppUrl}${path}${prefixWhenNotEmpty(
      searchParams.toString(),
      '?',
    )}`;
  }, [
    router.asPath,
    jwt,
    lang,
    publicRuntimeConfig.legacyAppUrl,
    searchParams,
  ]);

  return legacyPath;
};

export { useLegacyPath };
