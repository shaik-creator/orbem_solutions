import api from './api';

export const bookingService = {
  list: (params) => api.get('/bookings', { params }).then((response) => response.data.bookings),
  get: (id) => api.get(`/bookings/${id}`).then((response) => response.data),
  create: (payload) => api.post('/bookings', payload).then((response) => response.data),
  update: (id, payload) => api.put(`/bookings/${id}`, payload).then((response) => response.data),
  remove: (id) => api.delete(`/bookings/${id}`).then((response) => response.data),
  updateStatus: (id, payload) => api.put(`/bookings/${id}/status`, payload).then((response) => response.data),
  timeline: (id) => api.get(`/bookings/${id}/timeline`).then((response) => response.data.timeline),
  addTimeline: (id, payload) => api.post(`/bookings/${id}/timeline`, payload).then((response) => response.data)
};
