import { useRouter } from 'next/router';
import { dehydrate } from 'react-query/hydration';

import { OfferTypes } from '@/constants/OfferType';
import { QueryStatus } from '@/hooks/api/authenticated-query';
import {
  useChangeStatusMutation,
  useGetPlaceByIdQuery,
} from '@/hooks/api/places';
import { AvailabilityPageSingle } from '@/pages/AvailabilityPageSingle';
import { Spinner } from '@/ui/Spinner';
import { getApplicationServerSideProps } from '@/utils/getApplicationServerSideProps';

const Availability = () => {
  const router = useRouter();
  const { placeId } = router.query;

  const getPlaceByIdQuery = useGetPlaceByIdQuery({
    queryArguments: {
      id: placeId as string,
      scope: OfferTypes.PLACES,
    },
  });

  if (getPlaceByIdQuery.status !== QueryStatus.SUCCESS) {
    return <Spinner marginTop={4} />;
  }

  return (
    <AvailabilityPageSingle
      offer={getPlaceByIdQuery.data}
      error={getPlaceByIdQuery.error}
      useChangeStatusMutation={useChangeStatusMutation}
    />
  );
};

export const getServerSideProps = getApplicationServerSideProps(
  async ({ req, query, cookies, queryClient }) => {
    await useGetPlaceByIdQuery({
      req,
      queryClient,
      queryArguments: { id: query.placeId as string },
    });

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
        cookies,
      },
    };
  },
);

export default Availability;
