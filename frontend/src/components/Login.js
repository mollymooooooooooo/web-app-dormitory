import React, {useState} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import "./Signup.css";

const Login = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    try {
        if (!formData.password) {
            setError('Пароль обязателен');
            return;
        }

        const result = await login({
            email: formData.email.trim().toLowerCase(),
            password: formData.password
        });

        if (result.success) {
            navigate("/");
        } else {
            setError(result.error || 'Ошибка входа');
            console.error('Детали ошибки:', result.details);
        }
    } catch (error) {
        setError('Произошла ошибка при входе');
        console.error('Ошибка:', error);
    }
};

    // function getCookie(name) {
    //     let cookieValue = null;
    //     if (document.cookie && document.cookie !== '') {
    //         const cookies = document.cookie.split(';');
    //         for (let i = 0; i < cookies.length; i++) {
    //             const cookie = cookies[i].trim();
    //             if (cookie.substring(0, name.length + 1) === (name + '=')) {
    //                 cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
    //                 break;
    //             }
    //         }
    //     }
    //     return cookieValue;
    // }

    return (
        <div className="container">
            <div className="register-block">
                <h1>Вообще<i>житие</i></h1>
                <div className="signup-container">
                    <h2>Вход</h2>
                
                    {error && <div className="error-message">{error}</div>}
                
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="user@stud.kpfu.ru"
                            />
                            <label htmlFor="email">Email</label>
                        </div>
                    
                        <div className="form-group">
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder=" "
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="password">Пароль</label>
                        </div>
                    
                        <button type="submit" className="signup-button">Войти</button>
                    </form>
                
                    <p className="login-link">
                        Еще нет аккаунта? <a href="/signup">Зарегистрироваться</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
