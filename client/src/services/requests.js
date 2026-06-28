import api from './api';

export const requestsApi = {
  async list({ lng, lat, radiusKm } = {}) {
    const params = {};
    if (lng != null && lat != null && radiusKm != null) {
      params.lng = lng;
      params.lat = lat;
      params.radiusKm = radiusKm;
    }
    const { data } = await api.get('/requests', { params });
    return data;
  },

  // Citizens: server auto-filters by userId for role=Citizen
  async getMyRequests() {
    const { data } = await api.get('/requests');
    return data;
  },


  async create({ type, quantity, description, location }) {
    const { data } = await api.post('/requests', { type, quantity, description, location });
    return data.request;
  },

  async accept(id) {
    const { data } = await api.post(`/requests/${id}/accept`);
    return data.request;
  },

  async updateStatus(id, status) {
    const { data } = await api.patch(`/requests/${id}/status`, { status });
    return data.request;
  },

  async verify(id, action) {
    const { data } = await api.patch(`/requests/${id}/verify`, { action });
    return data.request;
  },

  async setPriority({ id, priority }) {
    const { data } = await api.patch(`/requests/${id}/priority`, { priority });
    return data.request;
  }
};
