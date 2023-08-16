import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next/types';
import { Cookies } from 'react-cookie';
import {
  QueryClient,
  QueryFunctionContext,
  QueryKey,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from 'react-query';
import { QueryState } from 'react-query/types/core/query';

import { FetchError } from '@/utils/fetchFromApi';
import { isTokenValid } from '@/utils/isTokenValid';

import { useCookiesWithOptions } from '../useCookiesWithOptions';
import { Headers } from './types/Headers';
import { createHeaders, useHeaders } from './useHeaders';

type QueryArguments = Record<string, string>;

type GeneratedQueryKey = readonly [QueryKey, QueryArguments];

type AuthenticatedQueryFunctionContext<TQueryArguments = unknown> =
  QueryFunctionContext<GeneratedQueryKey> & {
    headers: HeadersInit;
    queryArguments: TQueryArguments;
  };

type ServerSideOptions = {
  req: GetServerSidePropsContext['req'];
  queryClient: QueryClient;
};

export type UseAuthenticatedQueryOptions<
  TQueryFnData = unknown,
  TQueryArguments extends Object = {},
> = {
  queryArguments: TQueryArguments;
} & Omit<UseQueryOptions<TQueryFnData, FetchError, TQueryFnData>, 'queryFn'> & {
    queryFn?: (
      context: AuthenticatedQueryFunctionContext<TQueryArguments>,
    ) => TQueryFnData | Promise<TQueryFnData>;
  };

export type UseServerSideAuthenticatedQueryOptions<
  TQueryFnData = unknown,
  TQueryArguments = unknown,
> = UseAuthenticatedQueryOptions<TQueryFnData, TQueryArguments> &
  ServerSideOptions;

export type UseAuthenticatedQueryWrapperOptions<
  TQueryData = unknown,
  TQueryArguments = unknown,
> = Omit<UseAuthenticatedQueryOptions<TQueryData, TQueryArguments>, 'queryFn'>;

const isUnAuthorized = (status: number) => [401, 403].includes(status);

const generateQueryKey = <K, A>({
  queryKey,
  queryArguments,
}: {
  queryKey: K;
  queryArguments: A;
}): [K, A] => {
  if (Object.keys(queryArguments ?? {}).length > 0) {
    return [queryKey, queryArguments];
  }

  return [queryKey, {} as A];
};

type GetPreparedOptionsArguments<TQueryFnData, TQueryArguments> = {
  options: UseAuthenticatedQueryOptions<TQueryFnData, TQueryArguments>;
  isTokenPresent: boolean;
  headers: Headers;
};

const getPreparedOptions = <TQueryFnData = unknown, TQueryArguments = unknown>({
  options,
  isTokenPresent,
  headers,
}: GetPreparedOptionsArguments<TQueryFnData, TQueryArguments>) => {
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
}: UseServerSideAuthenticatedQueryOptions<TQueryFnData>) => {
  if (typeof window !== 'undefined') {
    throw new Error('Only use prefetchAuthenticatedQuery in server-side code');
  }

  const cookies = new Cookies(req?.headers?.cookie);
  const headers = createHeaders(cookies.get('token'));

  const { queryKey, queryFn } = getPreparedOptions<TQueryFnData>({
    options,
    isTokenPresent: isTokenValid(cookies.get('token')),
    headers,
  });

  try {
    await queryClient.prefetchQuery<TQueryFnData, FetchError>(
      queryKey,
      queryFn,
    );
  } catch {}

  return queryClient.getQueryState<TQueryFnData>(queryKey);
};

function useAuthenticatedQuery<
  TQueryFnData = unknown,
  TQueryArguments = unknown,
>(
  options: UseServerSideAuthenticatedQueryOptions<
    TQueryFnData,
    TQueryArguments
  >,
): Promise<QueryState<TQueryFnData>>;
function useAuthenticatedQuery<
  TQueryFnData = unknown,
  TQueryArguments = unknown,
>(
  options: UseAuthenticatedQueryOptions<TQueryFnData, TQueryArguments>,
): UseQueryResult<TQueryFnData, FetchError>;
function useAuthenticatedQuery<
  TQueryFnData = unknown,
  TQueryArguments = unknown,
>(
  options:
    | UseServerSideAuthenticatedQueryOptions<TQueryFnData, TQueryArguments>
    | UseAuthenticatedQueryOptions<TQueryFnData, TQueryArguments>,
):
  | Promise<QueryState<TQueryFnData>>
  | UseQueryResult<TQueryFnData, FetchError> {
  if ('req' in options) {
    return prefetchAuthenticatedQuery(options);
  }

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
}

export { prefetchAuthenticatedQuery, useAuthenticatedQuery };
export type { AuthenticatedQueryFunctionContext };
