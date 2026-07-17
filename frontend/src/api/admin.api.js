import client from './client';

export const adminApi = {
  createStation: (data) => {
    return client.post('/admins/stations/station', data).then((res) => res.data);
  },
  getStations: (page = 1, limit = 50, search = '') => {
    const params = { page, limit };
    if (search) params.search = search;
    return client.get('/admins/stations/station', { params }).then((res) => res.data);
  },
  createTrain: (data) => {
    return client.post('/admins/trains/train', data).then((res) => res.data);
  },
  getTrains: () => {
    return client.get('/admins/trains/train').then((res) => res.data);
  },
  getTrainById: (id) => {
    return client.get(`/admins/trains/train/${id}`).then((res) => res.data);
  },
  createRoute: (data) => {
    return client.post('/admins/trains/route', data).then((res) => res.data);
  },
  createSchedule: (data) => {
    return client.post('/admins/schedules/schedule', data).then((res) => res.data);
  },
  getSchedules: (params = {}) => {
    return client.get('/admins/schedules/schedule', { params }).then((res) => res.data);
  },
  cancelSchedule: (id) => {
    return client.put(`/admins/schedules/schedule/${id}`).then((res) => res.data);
  },
};
