import api from './api';

export const disastersApi = {
  async list(params = {}) {
    const { data } = await api.get('/disasters', { params });
    return data.reports;
  },

  // Alias used by new dashboards
  async getAll(params = {}) {
    const { data } = await api.get('/disasters', { params });
    return data;
  },

  async create(formData) {
    // accepts a FormData directly
    const { data } = await api.post('/disasters', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data.report;
  },

  async updateStatus(id, status) {
    const { data } = await api.patch(`/disasters/${id}/status`, { status });
    return data.report;
  },

  async respond(id) {
    const { data } = await api.post(`/disasters/${id}/respond`);
    return data.report;
  },

  async checkIn(id) {
    const { data } = await api.post(`/disasters/${id}/checkin`);
    return data.report;
  },

  // Legacy
  async setStatus({ id, status }) {
    const { data } = await api.patch(`/disasters/${id}/status`, { status });
    return data.report;
  }
};
