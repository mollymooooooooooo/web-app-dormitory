import React, {useState} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import "./Signup.css";

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });

    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { signup } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const result = await signup(formData.username, formData.email, formData.password);

            if (result.success) {
                navigate("/user_login");
            } else if (result.error) {
                setError(result.error);
            }
        } catch (error) {
            setError('Произошла ошибка при регистрации');
            console.error('Error signing up:', error);
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
                <h1>Вообще<i>заселение</i></h1>
                <div className="signup-container">
                    <h2>Регистрация</h2>
                
                    {error && <div className="error-message">{error}</div>}
                
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <input
                                type="text"
                                id="username"
                                name="username"
                                placeholder=" "
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="username">Имя пользователя</label>
                        </div>
                    
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
                    
                        <button type="submit" className="signup-button">Заселиться</button>
                    </form>
                
                    <p className="login-link">
                        Уже есть аккаунт? <a href="/user_login">Войти</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;