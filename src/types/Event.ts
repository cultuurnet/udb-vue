import { CalendarType } from '@/constants/CalendarType';
import type { OfferStatus } from '@/types/OfferStatus';
import { Values } from './Values';

type WorkFlowStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'READY_FOR_VALIDATION'
  | 'REJECTED'
  | 'DELETED';

type AddressInternal = {
  addressCountry: string;
  addressLocality: string;
  postalCode: string;
  streetAddress: string;
};
type Address =
  | AddressInternal
  | { nl: AddressInternal }
  | { fr: AddressInternal };

type Location = {
  '@id': string;
  '@type': string;
  '@context': '/contexts/place';
  mainLanguage: string;
  name: { nl: string; fr: string };
  image?: string;
  modified?: string;
  status?: OfferStatus;
  address: Address;
  contactPoint?: ContactPoint;
  labels: string[];
  geo?: {
    latitude: number;
    longitude: number;
  };
  organizer?: Organizer;
  mediaObject: MediaObject[];
  terms: Term[];
};

type ContactPoint = {
  phone: string[];
  email: string[];
  url: string[];
};

type Organizer = {
  '@id': string;
  '@context': string;
  mainLanguage: string;
  name: string | { nl: string };
  address: Address;
  labels: string[];
  contactPoint: ContactPoint;
  workflowStatus: WorkFlowStatus;
  languages: string[];
  completedLanguages: string[];
  modified: string;
  geo: {
    latitude: number;
    longitude: number;
  };
  url?: string;
};

type Term = {
  label: string;
  domain: string;
  id: string;
};

type MediaObject = {
  '@id': string;
  '@type': string;
  contentUrl: string;
  thumbnailUrl: string;
  description: string;
  copyrightHolder: string;
  inLanguage: string;
};

type BookingInfo = {
  availabilityStarts?: string;
  availabilityEnds?: string;
  price?: number;
  phone?: string;
  email?: string;
  description?: string;
  url?: string;
  urlLabel?: { nl: string };
};

type PriceInfo = {
  category: 'base' | 'tariff';
  name: { nl: string };
  price: number;
};

type SubEvent = {
  '@type': string;
  startDate: string;
  endDate: string;
  status?: OfferStatus;
};

type OpeningHours = {
  opens: string;
  closes: string;
  dayOfWeek: string[];
};

type Production = {
  id: string;
  title: string;
  otherEvents: string[];
};

type Event = {
  '@id': string;
  '@context': '/contexts/event';
  name: { [language: string]: string };
  description: { [language: string]: string };
  status?: OfferStatus;
  availableFrom: string;
  availableTo: string;
  labels?: string[];
  hiddenLabels?: string[];
  calendarSummary: string;
  location: Location;
  organizer: Organizer;
  contactPoint?: ContactPoint;
  terms: Term[];
  creator: string;
  created: string;
  modified: string;
  publisher: string;
  calendarType: Values<typeof CalendarType>;
  startDate: string;
  endDate: string;
  openingHours: OpeningHours[];
  subEvent: SubEvent[];
  performer: [{ performer: string }];
  sameAs: string[];
  seeAlso: string[];
  workflowStatus: WorkFlowStatus;
  audience: { audienceType: string };
  mainLanguage: string;
  languages: string[];
  completedLanguages: string[];
  mediaObject?: MediaObject[];
  image?: string;
  typicalAgeRange: string;
  bookingInfo?: BookingInfo;
  priceInfo?: PriceInfo[];
  production?: Production;
  regions: string[];
};

export type { Event };
