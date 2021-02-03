import { EventStatus } from '../../../components/EventStatus';
import { useRouter } from 'next/router';
import { useGetPlaceById } from '../../../hooks/api/places';
import { QueryStatus } from '../../../hooks/api/authenticated-query';
import { useState } from 'react';

const Status = () => {
  const router = useRouter();
  const { placeId } = router.query;
  const [errorMessage, setErrorMessage] = useState();
  const handleError = (error) => {
    setErrorMessage(error.message);
  };
  const { data: place = {}, status } = useGetPlaceById(
    { id: placeId },
    { onError: handleError },
  );
  return (
    <EventStatus
      offer={place}
      loading={status === QueryStatus.LOADING}
      errorMessage={errorMessage}
    />
  );
};

export default Status;
