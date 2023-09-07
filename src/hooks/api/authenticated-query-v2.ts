import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next/types';
import { Cookies } from 'react-cookie';
import {
  FetchQueryOptions,
  QueryClient,
  QueryFunctionContext,
  QueryKey,
  useQuery,
  UseQueryOptions,
} from 'react-query';

import { FetchError } from '@/utils/fetchFromApi';
import { isTokenValid } from '@/utils/isTokenValid';

import { useCookiesWithOptions } from '../useCookiesWithOptions';
import { createHeaders, useHeaders } from './useHeaders';

type QueryArguments = Record<string, string>;

type GenerateQueryKeyArguments = {
  queryKey: QueryKey;
  queryArguments: QueryArguments;
};

type GeneratedQueryKey = readonly [QueryKey, QueryArguments];

type AuthenticatedQueryFunctionContext<TQueryArguments = unknown> =
  QueryFunctionContext<GeneratedQueryKey> & {
    headers: HeadersInit;
    queryArguments?: TQueryArguments;
  };

type ServerSideOptions = {
  req: GetServerSidePropsContext['req'];
  queryClient: QueryClient;
};

type PrefetchAuthenticatedQueryOptions<TQueryFnData> = {
  queryArguments?: QueryArguments;
} & ServerSideOptions &
  FetchQueryOptions<TQueryFnData, FetchError, TQueryFnData, QueryKey>;

type UseAuthenticatedQueryOptions<
  TQueryFnData,
  TQueryArguments = QueryArguments,
> = {
  queryArguments?: TQueryArguments;
} & Omit<
  UseQueryOptions<TQueryFnData, FetchError, TQueryFnData, QueryKey>,
  'queryFn'
> & {
    queryFn: (
      context: AuthenticatedQueryFunctionContext,
    ) => TQueryFnData | Promise<TQueryFnData>;
  };

const isUnAuthorized = (status: number) => [401, 403].includes(status);

const generateQueryKey = ({
  queryKey,
  queryArguments,
}: GenerateQueryKeyArguments): GeneratedQueryKey => {
  if (Object.keys(queryArguments ?? {}).length > 0) {
    return [queryKey, queryArguments];
  }

  return [queryKey, {}];
};

type GetPreparedOptionsArguments<TQueryFnData> = {
  options: UseAuthenticatedQueryOptions<TQueryFnData>;
  isTokenPresent: boolean;
  headers: HeadersInit;
};

const getPreparedOptions = <TQueryFnData = unknown>({
  options,
  isTokenPresent,
  headers,
}: GetPreparedOptionsArguments<TQueryFnData>) => {
  const { queryKey, queryArguments, queryFn, ...restOptions } = options;
  const generatedQueryKey = generateQueryKey({
    queryKey,
    queryArguments,
  });

  return {
    ...restOptions,
    queryKey: generatedQueryKey,
    queryArguments,
    queryFn: (context) => queryFn({ ...context, queryArguments, headers }),
    ...('enabled' in restOptions && {
      enabled: isTokenPresent && !!restOptions.enabled,
    }),
  };
};

const prefetchAuthenticatedQuery = async <TQueryFnData = unknown>({
  req,
  queryClient,
  ...options
}: PrefetchAuthenticatedQueryOptions<TQueryFnData>) => {
  if (typeof window !== 'undefined') {
    throw new Error('Only use prefetchAuthenticatedQuery in server-side code');
  }

  const cookies = new Cookies(req?.headers?.cookie);
  const headers = createHeaders(cookies.get('token'));

  const { queryKey, queryFn } = getPreparedOptions<TQueryFnData>({
    // @ts-expect-error
    options,
    isTokenPresent: isTokenValid(cookies.get('token')),
    headers,
  });

  return queryClient.fetchQuery<TQueryFnData, FetchError>(queryKey, queryFn);
};

const useAuthenticatedQuery = <TQueryFnData = unknown>(
  options: UseAuthenticatedQueryOptions<TQueryFnData>,
) => {
  const headers = useHeaders();
  const { cookies, removeAuthenticationCookies } = useCookiesWithOptions([
    'token',
  ]);
  const router = useRouter();

  const preparedOptions = getPreparedOptions({
    options,
    isTokenPresent: isTokenValid(cookies.token),
    headers,
  });

  const result = useQuery(preparedOptions);

  if (
    isUnAuthorized(result?.error?.status) &&
    !router.asPath.startsWith('/login') &&
    router.asPath !== '/[...params]'
  ) {
    removeAuthenticationCookies();

    router.push('/login');

    return;
  }

  return result;
};

export { prefetchAuthenticatedQuery, useAuthenticatedQuery };
export type { AuthenticatedQueryFunctionContext };
