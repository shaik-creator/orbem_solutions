import api from './api';

export const assistantService = {
  history: () => api.get('/assistant/history').then((response) => response.data.messages),
  chat: (message) => api.post('/assistant/chat', { message }).then((response) => response.data)
};
