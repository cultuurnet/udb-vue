import MockSuggestedEvents from '../assets/suggested-events';
import { environments } from './api';

export const find = (apiUrl, headers, fetch) => async ({
  name = '',
  start = 0,
  limit = 10,
} = {}) => {
  const url = new URL(`${apiUrl}/productions/`);
  url.search = new URLSearchParams({
    name,
    start,
    limit,
  }).toString();
  const res = await fetch(url, {
    headers: headers(),
  });
  return await res.json();
};

export const addEventById = (apiUrl, headers, fetch) => async (
  productionId,
  eventId,
) => {
  const url = new URL(
    `${apiUrl}/productions/${productionId}/events/${eventId}`,
  );
  const res = await fetch(url, {
    method: 'PUT',
    headers: headers(),
  });
  const body = await res.text();
  if (body) {
    return JSON.parse(body);
  }
  return {};
};

export const deleteEventById = (apiUrl, headers, fetch) => async (
  productionId,
  eventId,
) => {
  const url = new URL(
    `${apiUrl}/productions/${productionId}/events/${eventId}`,
  );

  return await fetch(url, {
    method: 'DELETE',
    headers: headers(),
  });
};

export const getSuggestedEvents = (
  apiUrl,
  headers,
  fetch,
  environment,
  debug,
) => async () => {
  const url = `${apiUrl}/productions/suggestion`;

  if (environment === environments.dev) {
    debug({
      type: 'GET',
      url,
    });
    return MockSuggestedEvents;
  }

  const res = await fetch(url, {
    headers: headers(),
  });
  return await res.json();
};

export const skipSuggestedEvents = (
  apiUrl,
  headers,
  fetch,
  environment,
  debug,
) => async (eventIds = []) => {
  const url = `${apiUrl}/productions/skip`;

  if (environment === environments.dev) {
    debug({
      type: 'POST',
      url,
      body: {
        eventIds,
      },
    });
    return;
  }

  await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      eventIds,
    }),
  });
};

export const createWithEvents = (apiUrl, headers, fetch) => async ({
  name = '',
  eventIds = [],
} = {}) => {
  const url = `${apiUrl}/productions/`;
  await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      name,
      eventIds,
    }),
  });
};
