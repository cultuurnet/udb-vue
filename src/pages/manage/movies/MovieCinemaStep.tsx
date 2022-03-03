import debounce from 'lodash/debounce';
import { useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { OfferCategories } from '@/constants/OfferCategories';
import { useGetPlacesByQuery } from '@/hooks/api/places';
import type { StepProps } from '@/pages/Steps';
import type { Place } from '@/types/Place';
import { Button, ButtonVariants } from '@/ui/Button';
import { FormElement } from '@/ui/FormElement';
import { Icon, Icons } from '@/ui/Icon';
import { Inline } from '@/ui/Inline';
import type { StackProps } from '@/ui/Stack';
import { getStackProps, Stack } from '@/ui/Stack';
import { Text } from '@/ui/Text';
import { getValueFromTheme } from '@/ui/theme';
import { Typeahead } from '@/ui/Typeahead';

import type { MovieFormData } from './MoviePage';

const getValue = getValueFromTheme('moviesCreatePage');

type MovieCinemaProps = StackProps & StepProps<MovieFormData>;

const MovieCinemaStep = ({
  formState: { errors },
  getValues,
  reset,
  control,
  loading,
  onChange,
  ...props
}: MovieCinemaProps) => {
  const { t, i18n } = useTranslation();
  const [searchInput, setSearchInput] = useState('');

  const useGetCinemasQuery = useGetPlacesByQuery(
    {
      name: searchInput,
      terms: [OfferCategories.Bioscoop],
    },
    { enabled: !!searchInput },
  );

  // @ts-expect-error
  const cinemas = useMemo(() => useGetCinemasQuery.data?.member ?? [], [
    // @ts-expect-error
    useGetCinemasQuery.data?.member,
  ]);

  return (
    <Stack {...getStackProps(props)}>
      <Controller
        control={control}
        name="cinema"
        render={({ field }) => {
          const selectedCinema = field?.value;

          if (!selectedCinema) {
            return (
              <FormElement
                id="step3-cinema-typeahead"
                label={t('movies.create.actions.choose_cinema')}
                error={
                  errors?.cinema
                    ? t(
                        // @ts-expect-error
                        `movies.create.validation_messages.cinema.${errors?.cinema.type}`,
                      )
                    : undefined
                }
                loading={loading}
                Component={
                  <Typeahead<Place>
                    options={cinemas}
                    onInputChange={debounce(setSearchInput, 275)}
                    labelKey={(cinema) =>
                      cinema.name[i18n.language] ??
                      cinema.name[cinema.mainLanguage]
                    }
                    selected={field.value ? [field.value] : []}
                    maxWidth="43rem"
                    onChange={(places) => {
                      field.onChange(places?.[0]);
                      onChange(places?.[0]);
                    }}
                    minLength={3}
                  />
                }
              />
            );
          }
          return (
            <Inline alignItems="center" spacing={3}>
              <Icon
                name={Icons.CHECK_CIRCLE}
                color={getValue('check.circleFillColor')}
              />
              <Text>
                {selectedCinema.name[i18n.language] ??
                  selectedCinema.name[selectedCinema.mainLanguage]}
              </Text>
              <Button
                variant={ButtonVariants.LINK}
                onClick={() =>
                  reset(
                    { ...getValues(), cinema: undefined },
                    { keepDirty: true },
                  )
                }
              >
                {t('movies.create.actions.change_cinema')}
              </Button>
            </Inline>
          );
        }}
      />
    </Stack>
  );
};

export { MovieCinemaStep };
