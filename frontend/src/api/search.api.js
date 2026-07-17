import client from './client';

export const searchApi = {
  search: (fromCode, toCode, travelDate) => client.get('/search/trains', {
    params: { from: fromCode, to: toCode, date: travelDate },
  }),
  autocomplete: (query) => client.get('/search/autocomplete', {
    params: { q: query },
  }),
};
