import api from './api';

export const supportService = {
  createTicket: (payload) => api.post('/support/tickets', payload).then((response) => response.data),
  listTickets: () => api.get('/support/tickets').then((response) => response.data.tickets),
  updateTicketStatus: (id, status) => api.put(`/support/tickets/${id}/status`, { status }).then((response) => response.data)
};
