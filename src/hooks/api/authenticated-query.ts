import { isEqual } from 'lodash';
import flatten from 'lodash/flatten';
import type { NextApiRequest } from 'next';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { Cookies } from 'react-cookie';
import {
  MutationFunction,
  QueryClient,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from 'react-query';

import { useCookiesWithOptions } from '@/hooks/useCookiesWithOptions';
import type { CalendarSummaryFormat } from '@/utils/createEmbededCalendarSummaries';
import type { ErrorObject, FetchError } from '@/utils/fetchFromApi';
import { isErrorObject } from '@/utils/fetchFromApi';
import { isTokenValid } from '@/utils/isTokenValid';

import { createHeaders, useHeaders } from './useHeaders';

type ServerSideQueryOptions = {
  req?: NextApiRequest;
  queryClient?: QueryClient;
};

type AuthenticatedQueryOptions<T> = ServerSideQueryOptions & T;

type PaginationOptions = {
  paginationOptions?: {
    start: number;
    limit: number;
  };
};

type SortOptions = {
  sortOptions?: {
    field: string;
    order: string;
  };
};

type CalendarSummaryFormats = {
  calendarSummaryFormats?: CalendarSummaryFormat[];
};

const QueryStatus = {
  IDLE: 'idle',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success',
};

const prepareKey = ({ queryKey, queryArguments }) => {
  const key = Array.isArray(queryKey) ? queryKey : [queryKey];
  const args = Object.entries(queryArguments ?? {}).filter(
    ([_, value]) => typeof value !== 'undefined',
  );
  const preparedKey = flatten(key);

  if (args.length > 0) {
    preparedKey.push(Object.fromEntries(args));
  }

  return preparedKey;
};

const prepareArguments = ({
  options: {
    queryKey,
    queryFn,
    queryArguments,
    enabled = true,
    req,
    queryClient,
    ...configuration
  },
  isTokenPresent = false,
  headers,
}) => {
  const parsedQueryKey = prepareKey({ queryArguments, queryKey });

  return {
    queryKey: parsedQueryKey,
    queryFn: async () =>
      await queryFn({ ...queryArguments, headers, queryKey: parsedQueryKey }),
    enabled: isTokenPresent && !!enabled,
    ...configuration,
  };
};

const isUnAuthorized = (status: number) => [401, 403].includes(status);

const getStatusFromResults = (results) => {
  if (results.some(({ status }) => status === QueryStatus.ERROR)) {
    return {
      status: QueryStatus.ERROR,
      error: results
        .map(({ error }) => error)
        .filter((error) => error !== undefined),
    };
  }

  if (results.every(({ status }) => status === QueryStatus.SUCCESS)) {
    return { status: QueryStatus.SUCCESS };
  }
  if (results.some(({ status }) => status === QueryStatus.LOADING)) {
    return { status: QueryStatus.LOADING };
  }
  if (results.some(({ status }) => status === QueryStatus.IDLE)) {
    return { status: QueryStatus.IDLE };
  }
};

const prefetchAuthenticatedQueries = async ({
  req,
  queryClient,
  options: rawOptions = [],
}) => {
  const cookies = new Cookies(req?.headers?.cookie);
  const headers = createHeaders(cookies.get('token'));

  const preparedArguments = rawOptions.map((options) =>
    prepareArguments({
      options,
      isTokenPresent: isTokenValid(cookies.get('token')),
      headers,
    }),
  );

  await Promise.all(
    preparedArguments.map(({ queryKey, queryFn }) =>
      queryClient.prefetchQuery(queryKey, queryFn),
    ),
  );

  return await Promise.all(
    preparedArguments.map(({ queryKey }) => queryClient.getQueryData(queryKey)),
  );
};

const prefetchAuthenticatedQuery = async <TData>({
  req,
  queryClient,
  ...options
}): Promise<TData> => {
  const cookies = new Cookies(req?.headers?.cookie);
  const headers = createHeaders(cookies.get('token'));

  const { queryKey, queryFn } = prepareArguments({
    // @ts-expect-error
    options,
    isTokenPresent: isTokenValid(cookies.get('token')),
    headers,
  });

  return await queryClient.fetchQuery(queryKey, queryFn);
};

/// /////////////////////////////////////////////////////////////////////////////////////////////

const isDuplicateMutation = (
  queryClient: QueryClient,
  mutationFn: MutationFunction,
  variables: any,
  mutationKey?: string,
): boolean => {
  if (!mutationKey) {
    // eslint-disable-next-line no-console
    console.warn(`${mutationFn.name} has no mutationKey configured`);

    return false;
  }

  // Temporary disable caching on price-info
  // https://jira.uitdatabank.be/browse/III-5620

  const disabledMutations = [
    'offers-add-price-info',
    'offers-change-calendar',
    'places-add',
    'request-ownership',
  ];

  if (disabledMutations.includes(mutationKey)) {
    return false;
  }

  const mutations = queryClient.getMutationCache().findAll({
    mutationKey,
  });

  const latestMutation = mutations.slice(-2)[0];

  // If the latest mutation was unsuccessful, we don't want to trigger a false positive.
  if (latestMutation.state.error) {
    return false;
  }

  return (
    mutations.length > 1 && isEqual(latestMutation.options.variables, variables)
  );
};

const useAuthenticatedMutation = ({ mutationFn, ...configuration }) => {
  const router = useRouter();
  const headers = useHeaders();
  const queryClient = useQueryClient();

  const { removeAuthenticationCookies } = useCookiesWithOptions();

  const innerMutationFn = useCallback(async (variables) => {
    const isDuplicate = isDuplicateMutation(
      queryClient,
      mutationFn,
      variables,
      configuration.mutationKey,
    );

    if (isDuplicate) return;

    const response = await mutationFn({ ...variables, headers });

    if (!response) return '';

    if (isUnAuthorized(response?.status)) {
      removeAuthenticationCookies();
      queryClient.invalidateQueries('user');
      router.push('/login');
    }

    const result = await response.text();

    if (!result) {
      return '';
    }
    return JSON.parse(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useMutation(innerMutationFn, configuration);
};

const useAuthenticatedMutations = ({
  mutationFns,
  ...configuration
}: {
  mutationFns: (variables: unknown) => Promise<Array<Response | ErrorObject>>;
}) => {
  const router = useRouter();
  const headers = useHeaders();
  const queryClient = useQueryClient();

  const { removeAuthenticationCookies } = useCookiesWithOptions();

  const innerMutationFn = useCallback(async (variables) => {
    const responses = await mutationFns({ ...variables, headers });

    if (responses.some((response) => isUnAuthorized(response.status))) {
      removeAuthenticationCookies();
      queryClient.invalidateQueries('user');
      router.push('/login');
      return;
    }

    if (responses.some(isErrorObject)) {
      const errorMessages = responses
        .filter(isErrorObject)
        .map((response) => response.message)
        .join(', ');
      throw new Error(errorMessages);
    }

    return Promise.all(
      (responses as Response[]).map(async (response) => {
        const result = await response.text();

        if (!result) {
          return '';
        }

        return JSON.parse(result);
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useMutation(innerMutationFn, configuration);
};

type UseAuthenticatedQueryResult<TData> =
  | Promise<TData>
  | UseQueryResult<TData, FetchError>;

const useAuthenticatedQuery = <TData>(
  options,
): UseAuthenticatedQueryResult<TData> => {
  if (!!options.req && !!options.queryClient && typeof window === 'undefined') {
    return prefetchAuthenticatedQuery<TData>(options);
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { asPath, ...router } = useRouter();

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const headers = useHeaders();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { cookies, removeAuthenticationCookies } = useCookiesWithOptions([
    'token',
  ]);

  const preparedArguments = prepareArguments({
    options,
    isTokenPresent: isTokenValid(cookies.token),
    headers,
  });

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const result = useQuery<TData, FetchError>(preparedArguments);

  if (isUnAuthorized(result?.error?.status)) {
    if (!asPath.startsWith('/login') && asPath !== '/[...params]') {
      removeAuthenticationCookies();
      router.push('/login');
    }
  }

  return result;
};

const useAuthenticatedQueries = ({
  req,
  queryClient,
  options: rawOptions = [],
}) => {
  if (!!req && !!queryClient && typeof window === 'undefined') {
    return prefetchAuthenticatedQueries({
      req,
      queryClient,
      options: rawOptions,
    });
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { asPath, ...router } = useRouter();

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const headers = useHeaders();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { cookies, removeAuthenticationCookies } = useCookiesWithOptions([
    'token',
  ]);

  const options = rawOptions.map((options) =>
    prepareArguments({
      options,
      isTokenPresent: isTokenValid(cookies.token),
      headers,
    }),
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const results = useQueries(options);

  // @ts-expect-error
  if (results.some((result) => isUnAuthorized(result?.error?.status))) {
    if (!asPath.startsWith('/login') && asPath !== '/[...params]') {
      removeAuthenticationCookies();
      queryClient.invalidateQueries('user');
      router.push('/login');
    }
  }

  return {
    data: results.map(({ data }) => data).filter((data) => data !== undefined),
    ...getStatusFromResults(results),
  };
};

export {
  getStatusFromResults,
  QueryStatus,
  useAuthenticatedMutation,
  useAuthenticatedMutations,
  useAuthenticatedQueries,
  useAuthenticatedQuery,
};

export type {
  AuthenticatedQueryOptions,
  CalendarSummaryFormats,
  PaginationOptions,
  ServerSideQueryOptions,
  SortOptions,
};
