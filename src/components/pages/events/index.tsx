import { Cookies } from 'react-cookie';
import { dehydrate } from 'react-query/hydration';
import type { User } from 'types/User';

import { useGetEventsByCreator } from '@/hooks/api/events';
import { DashboardPage, itemsPerPage } from '@/pages/dashboard';
import { getApplicationServerSideProps } from '@/utils/getApplicationServerSideProps';

type Props = {
  page?: number;
};

const Index = ({ page }: Props) => (
  <DashboardPage activeTab="events" page={page} />
);

export const getServerSideProps = getApplicationServerSideProps(
  async ({ req, query, cookies: rawCookies, queryClient }) => {
    const cookies = new Cookies(rawCookies);
    const user: User = cookies.get('user');
    const page = query.page ? parseInt(query.page) : 1;

    await useGetEventsByCreator({
      req,
      queryClient,
      creator: user,
      paginationOptions: {
        start: (page - 1) * itemsPerPage,
        limit: itemsPerPage,
      },
    });

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
        cookies: rawCookies,
        page,
      },
    };
  },
);

export default Index;
