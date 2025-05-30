import axios from 'axios';
import { refreshToken } from '../context/AuthContext';

const refreshApi = axios.create({
    baseURL: 'http://localhost:8000/',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

const api = axios.create({
    baseURL: 'http://localhost:8000/',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('Отправляемый запрос:', config);
  return config;
});


function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Пропускаем ошибки, не связанные с аутентификацией
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }
    
    // Если это уже повторная попытка - выходим
    if (originalRequest._retry) {
      console.log('Повторная попытка не удалась - разлогиниваем');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('username');
      window.location.href = '/user_login';
      return Promise.reject(error);
    }
    
    originalRequest._retry = true;
    
    try {
      const refresh = localStorage.getItem('refreshToken');
      if (!refresh) {
        throw new Error('No refresh token');
      }
      
      // Используем refreshApi вместо api, чтобы избежать цикла
      const response = await refreshApi.post('/api/token/refresh/', { refresh });
      const newAccessToken = response.data.access;
      
      localStorage.setItem('token', newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      console.error("Ошибка обновления токена:", refreshError);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('username');
      window.location.href = '/user_login';
      return Promise.reject(error);
    }
  }
);

export default api;