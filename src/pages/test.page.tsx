import { useEffect } from 'react';
import { dehydrate } from 'react-query/hydration';

import {
  AuthenticatedQueryFunctionContext,
  prefetchAuthenticatedQuery,
  useAuthenticatedQuery,
} from '@/hooks/api/authenticated-query-v2';
import { Event } from '@/types/Event';
import { fetchFromApi, isErrorObject } from '@/utils/fetchFromApi';
import { getApplicationServerSideProps } from '@/utils/getApplicationServerSideProps';

const EVENT_ID = 'a9e9cdce-2e3c-4b17-9c6b-a7eb445252d1';

const getEventById = async ({
  queryKey,
  headers,
}: AuthenticatedQueryFunctionContext) => {
  const [key, { id }] = queryKey;
  const res = await fetchFromApi({
    path: `/event/${id}`,
    options: {
      headers,
    },
  });
  if (isErrorObject(res)) {
    // eslint-disable-next-line no-console
    return console.error(res);
  }
  return await res.json();
};

const Test = () => {
  const query = useAuthenticatedQuery<Event>({
    queryKey: ['events'],
    queryFn: getEventById,
    queryArguments: { id: EVENT_ID },
    enabled: !!EVENT_ID,
  });

  useEffect(() => {
    console.log({ eventOnClient: query.data });
  }, [query.data]);

  return null;
};

export const getServerSideProps = getApplicationServerSideProps(
  async ({ req, cookies, queryClient }) => {
    const eventOnServer = await prefetchAuthenticatedQuery<Event>({
      req,
      queryClient,
      queryKey: ['events'],
      queryFn: getEventById,
      queryArguments: { id: EVENT_ID },
    });

    console.log({ eventOnServer });

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
        cookies,
      },
    };
  },
);

export default Test;
