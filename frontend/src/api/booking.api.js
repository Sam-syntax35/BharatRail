import client from './client';

export const bookingApi = {
  create: (data) => {
    return client.post('/bookings/bookings', data).then((res) => res.data);
  },
  list: (status, page = 1, limit = 10) => {
    const params = { page, limit };
    if (status) params.status = status;
    return client.get('/bookings/bookings', { params }).then((res) => res.data);
  },
  getById: (id) => {
    return client.get(`/bookings/bookings/${id}`).then((res) => res.data);
  },
  verifyPayment: (id, data) => {
    return client.post(`/bookings/bookings/${id}/verify-payment`, data).then((res) => res.data);
  },
  cancel: (id) => {
    return client.post(`/bookings/bookings/${id}/cancel`).then((res) => res.data);
  },
};
