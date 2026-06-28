import api from './api.js';

export const broadcastsApi = {
  send: async ({ id, message }) => {
    const { data } = await api.post(`/disasters/${id}/broadcast`, { message });
    return data;
  }
};
