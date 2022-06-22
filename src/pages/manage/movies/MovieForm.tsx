import { format } from 'date-fns';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import { CalendarType } from '@/constants/CalendarType';
import { EventTypes } from '@/constants/EventTypes';
import {
  additionalInformationStepConfiguration,
  AdditionalInformationStepVariant,
} from '@/pages/steps/AdditionalInformationStep';
import { eventTypeAndThemeStepConfiguration } from '@/pages/steps/EventTypeAndThemeStep';
import { placeStepConfiguration } from '@/pages/steps/PlaceStep';
import { productionStepConfiguration } from '@/pages/steps/ProductionStep';
import { StepsForm } from '@/pages/steps/StepsForm';
import {
  convertTimeTableToSubEvents,
  timeTableStepConfiguration,
} from '@/pages/steps/TimeTableStep';
import type { Event } from '@/types/Event';
import type { SubEvent } from '@/types/Offer';
import type { Place } from '@/types/Place';
import type { Production } from '@/types/Production';
import { WorkflowStatusMap } from '@/types/WorkflowStatus';
import { parseOfferId } from '@/utils/parseOfferId';

type FormData = {
  eventTypeAndTheme: {
    eventType: { id: string; label: string };
    theme: { id: string; label: string };
  };
  timeTable: any;
  place: Place;
  production: Production & { customOption?: boolean };
};

const convertSubEventsToTimeTable = (subEvents: SubEvent[] = []) => {
  const dateStart = format(new Date(subEvents[0].startDate), 'dd/MM/yyyy');
  const dateEnd = format(
    new Date(subEvents[subEvents.length - 1].endDate),
    'dd/MM/yyyy',
  );

  const data = subEvents.reduce((acc, subEvent) => {
    const date = new Date(subEvent.startDate);

    const formattedDate = format(date, 'dd/MM/yyyy');
    const formattedTime = format(date, "HH'h'mm'm'");

    const prevData = acc?.[formattedDate] ?? {};
    const insertKey = Math.max(0, Object.keys(prevData).length);

    const values = { ...prevData, [insertKey]: formattedTime };
    return { ...acc, [formattedDate]: values };
  }, {});

  return {
    dateStart,
    dateEnd,
    data,
  };
};

const MovieForm = (props) => {
  const router = useRouter();
  const parts = router.pathname.split('/');
  const { t } = useTranslation();

  const convertEventToFormData = (event: Event) => {
    return {
      eventTypeAndTheme: {
        theme: event.terms.find((term) => term.domain === 'theme'),
        eventType: event.terms.find((term) => term.domain === 'eventtype'),
      },
      place: event.location,
      timeTable: convertSubEventsToTimeTable(event.subEvent),
      production: {
        production_id: event.production?.id,
        name: event.production?.title,
        events: event.production?.otherEvents,
      },
    };
  };

  const convertFormDataToEvent = ({
    production,
    eventTypeAndTheme: { eventType, theme },
    place,
    timeTable,
  }: FormData) => {
    return {
      mainLanguage: 'nl',
      name: production.name,
      calendar: {
        calendarType: CalendarType.MULTIPLE,
        timeSpans: convertTimeTableToSubEvents(timeTable),
      },
      type: {
        id: eventType?.id,
        label: eventType?.label,
        domain: 'eventtype',
      },
      ...(theme && {
        theme: {
          id: theme?.id,
          label: theme?.label,
          domain: 'theme',
        },
      }),
      location: {
        id: parseOfferId(place['@id']),
      },
      workflowStatus: WorkflowStatusMap.DRAFT,
      audienceType: 'everyone',
    };
  };

  return (
    <StepsForm
      {...props}
      key={parts[parts.length - 1]} // needed to re-render the form between create and edit.
      label="udb-filminvoer"
      convertFormDataToEvent={convertFormDataToEvent}
      convertEventToFormData={convertEventToFormData}
      title={t(`movies.create.title`)}
      toastConfiguration={{
        messages: {
          image: t('movies.create.toast.success.image'),
          description: t('movies.create.toast.success.description'),
          calendar: t('movies.create.toast.success.calendar'),
          video: t('movies.create.toast.success.video'),
          theme: t('movies.create.toast.success.theme'),
          location: t('movies.create.toast.success.location'),
          name: t('movies.create.toast.success.name'),
        },
        title: t('movies.create.toast.success.title'),
      }}
      configuration={[
        eventTypeAndThemeStepConfiguration,
        timeTableStepConfiguration,
        {
          ...placeStepConfiguration,
          stepProps: {
            terms: [EventTypes.Bioscoop],
          },
        },
        productionStepConfiguration,
        {
          ...additionalInformationStepConfiguration,
          variant: AdditionalInformationStepVariant.MINIMAL,
        },
      ]}
    />
  );
};

export { MovieForm };
export type { FormData };
