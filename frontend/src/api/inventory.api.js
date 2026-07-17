import client from './client';

export const inventoryApi = {
  getAvailability: (scheduleId) => {
    return client.get(`/inventory/schedules/${scheduleId}/availability`).then((res) => res.data);
  },
  getSeats: (scheduleId, params = {}) => {
    const query = {};
    if (params.status) query.status = params.status;
    if (params.seatType) query.seatType = params.seatType;
    if (params.fromSeq) query.fromSeq = params.fromSeq;
    if (params.toSeq) query.toSeq = params.toSeq;
    
    return client.get(`/inventory/schedules/${scheduleId}/seats`, { params: query }).then((res) => res.data);
  },
};
