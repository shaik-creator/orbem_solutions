import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 20000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('orbem_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('orbem_token');
      localStorage.removeItem('orbem_user');
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error) {
  return error.response?.data?.message || error.message || 'Request failed. Please try again.';
}

export async function downloadFile(path, filename) {
  const response = await api.get(path, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default api;
