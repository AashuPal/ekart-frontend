import axios from 'axios';

const API_BASE = '/api/addresses';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

export const getAddresses = () =>
  axios.get(API_BASE, { headers: getAuthHeaders() }).then(res => res.data);

export const addAddress = (data) =>
  axios.post(API_BASE, data, { headers: getAuthHeaders() }).then(res => res.data);

export const updateAddress = (id, data) =>
  axios.put(`${API_BASE}/${id}`, data, { headers: getAuthHeaders() }).then(res => res.data);

export const deleteAddress = (id) =>
  axios.delete(`${API_BASE}/${id}`, { headers: getAuthHeaders() }).then(res => res.data);

export const setDefaultAddress = (id) =>
  axios.patch(`${API_BASE}/${id}/default`, null, { headers: getAuthHeaders() }).then(res => res.data);