import client from './client';

export const searchApi = {
  search: (fromCode, toCode, travelDate) => {
    const params = { from: fromCode, to: toCode };
    if (travelDate) params.date = travelDate;
    return client.get('/search/trains', { params }).then((res) => res.data);
  },
  autocomplete: (query) => {
    return client.get('/search/autocomplete', { params: { q: query } }).then((res) => res.data);
  },
};
