import jwt_decode from 'jwt-decode';

import { FetchError, fetchFromApi, isErrorObject } from '@/utils/fetchFromApi';

import { Cookies, useCookiesWithOptions } from '../useCookiesWithOptions';
import { ServerSideQueryOptions } from './authenticated-query';
import {
  prefetchAuthenticatedQuery,
  useAuthenticatedQuery as useAuthenticatedQueryV2,
} from './authenticated-query-v2';

type User = {
  sub: string;
  given_name: string;
  family_name: string;
  nickname: string;
  name: string;
  picture: string;
  locale: string;
  updated_at: string;
  email: string;
  email_verified: boolean;
  'https://publiq.be/uitidv1id': string;
  'https://publiq.be/hasMuseumpasSubscription': boolean;
  'https://publiq.be/first_name': string;
  exp: number;
};

type decodedAccessToken = {
  'https://publiq.be/publiq-apis': string;
  'https://publiq.be/client-name': string;
  'https://publiq.be/email': string;
  'https://publiq.be/uitidv1id': string;
  iss: string;
  sub: string;
  aud: string[];
  iat: number;
  exp: number;
  azp: string;
  scope: string;
};

const getUser = async (cookies: Cookies) => {
  if (!cookies.idToken || !cookies.token) {
    throw new FetchError(401, 'Unauthorized');
  }

  const userInfo = jwt_decode<User>(cookies.idToken);
  const decodedAccessToken = jwt_decode(cookies.token) as decodedAccessToken;

  if (Date.now() >= decodedAccessToken.exp * 1000) {
    throw new FetchError(401, 'Unauthorized');
  }

  return userInfo;
};

const useGetUserQuery = () => {
  const { cookies } = useCookiesWithOptions(['idToken']);

  return useAuthenticatedQueryV2({
    queryKey: ['user'],
    queryFn: () => getUser(cookies),
  });
};

const useGetUserQueryServerSide = (
  { req, queryClient }: ServerSideQueryOptions = {},
  configuration = {},
) => {
  const cookies = req.cookies;

  return prefetchAuthenticatedQuery({
    req,
    queryClient,
    queryKey: ['user'],
    queryFn: () => getUser(cookies),
    ...configuration,
  });
};

const getPermissions = async ({ headers }) => {
  const res = await fetchFromApi({
    path: '/user/permissions/',
    options: { headers },
  });

  if (isErrorObject(res)) {
    // eslint-disable-next-line no-console
    console.error(res);
    return;
  }

  return (await res.json()) as string[];
};

const useGetPermissionsQuery = (configuration = {}) =>
  useAuthenticatedQueryV2({
    queryKey: ['user', 'permissions'],
    queryFn: getPermissions,
    ...configuration,
  });

const getRoles = async ({ headers }) => {
  const res = await fetchFromApi({
    path: '/user/roles/',
    options: {
      headers,
    },
  });

  if (isErrorObject(res)) {
    // eslint-disable-next-line no-console
    console.error(res);
    return;
  }

  return (await res.json()) as any[];
};

const useGetRolesQuery = (configuration = {}) =>
  useAuthenticatedQueryV2({
    queryKey: ['user', 'roles'],
    queryFn: getRoles,
    ...configuration,
  });

export {
  useGetPermissionsQuery,
  useGetRolesQuery,
  useGetUserQuery,
  useGetUserQueryServerSide,
};
export type { User };
