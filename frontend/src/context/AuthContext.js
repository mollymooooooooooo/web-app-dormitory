import React, { createContext, useContext, useState, useEffect } from 'react';
import api from "../api/api";
import refreshApi from "../api/api";
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuth = async () => {
  setIsLoading(true);
  try {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (!token || !username) {
      throw new Error("Требуется авторизация");
    }

    const decoded = jwtDecode(token);
    
    // Проверяем expiration time
    if (decoded.exp < Date.now() / 1000) {
      const newToken = await refreshToken();
      if (!newToken) throw new Error("Токен истёк");
      return true;
    }

    // Проверяем соответствие username
    // if (decoded.username !== username) {
    //   throw new Error("Несоответствие токена");
    // }

    // Получаем данные пользователя
    const response = await api.get(`/api/profile/${username}/`);
    setUser(response.data);
    setIsAuthenticated(true);
    return true;
  } catch (error) {
    console.error("Auth check failed:", error.message);
    setIsAuthenticated(false);
    setUser(null);
    return false;
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      console.log('Отправка данных для входа:', credentials);
      const response = await api.post('/api/login/', {
        email: credentials.email,
        password: credentials.password
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'

      }
    });

    console.log('Ответ от сервера:', response.data);
    const { access, refresh, username } = response.data;
    
    // Сохраняем все данные
    localStorage.setItem('token', access);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('username', username);
    
    setUser({ username });
    setIsAuthenticated(true);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.detail || "Ошибка входа" 
    };
  }
};

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/user_login');
};

  const signup = async (username, email, password) => {
    try {
      const response = await api.post('/api/signup/', {
        username: username.trim(),
        email: email.trim(),
        password: password.trim()
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
      if (response.data.success) {
        // await login(username, password);
        return { success: true, requiresActivation: response.data.requires_activation };
    }
    } catch (error) {
      console.error('Signup error details:', error.response?.data);
      return { 
        error: error.response?.data?.error || 
               Object.values(error.response?.data).flat().join(', ') || 
               'Signup failed' 
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        setIsLoading,
        login,
        logout,
        signup,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useProtectedRoute = () => {
    const { isAuthenticated, loading, checkAuth } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const verifyAuth = async () => {
            const isAuth = await checkAuth();
            if (!isAuth && !loading) {
                navigate('/login');
            }
        };
        verifyAuth();
    }, []);
};

export const refreshToken = async () => {
  try {
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) return null;
    
    // Используем refreshApi вместо api
    const response = await refreshApi.post('/api/token/refresh/', { refresh });
    const newAccessToken = response.data.access;
    
    localStorage.setItem('token', newAccessToken);
    return newAccessToken;
  } catch (error) {
    console.error("Refresh failed:", error);
    return null;
  }
};

export const useAuth = () => useContext(AuthContext);