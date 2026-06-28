import api from './api';

export const usersApi = {
  async me() {
    const { data } = await api.get('/users/me');
    return data.user;
  },

  async list() {
    const { data } = await api.get('/users');
    return data.users;
  },

  async setRole({ id, role }) {
    const { data } = await api.patch(`/users/${id}/role`, { role });
    return data.user;
  },

  async remove({ id }) {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  }
};
