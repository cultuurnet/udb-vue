import { OfferTypes } from '@/constants/OfferType';
import { useGetPlaceByIdQuery } from '@/hooks/api/places';

const useGetPlace = ({ id, onSuccess, enabled }) =>
  useGetPlaceByIdQuery({
    onSuccess,
    enabled: !!id && !!enabled,
    queryArguments: { id, scope: OfferTypes.PLACES },
  })?.data;

export { useGetPlace };
