import React, { useState, useEffect } from 'react';
import Header from './Header';
import SlideMenu from './SlideMenu';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import './FeedbackPage.css';

const FeedbackPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        room: '',
        email: '',
        phone: '',
        message: '',
        category: 'question'
    });
    const { user } = useAuth();

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        try{
            const submissionData = {
                ...formData,
                ...(user && {email: user.email || formData.email})
            };
            const response = await api.post('/api/feedback/', submissionData)
            if (response.data.success) {
                setIsSubmitted(true);
                setFormData({
                    name: user ? user.username : '',
                    room: '',
                    email: user ? user.email : '',
                    phone: '',
                    message: '',
                    category: 'question'
                });
            }
        } catch (error) {
            console.error('Ошибка при отправке формы: ', error);
            alert('Произошла ошибка при отправке формы. Попробуйте позже.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.username,
                email: user.email
            }))
        }
    }, [user]);

    return (
        <div className="feedback-container">
            <Header user={user} PageName="житие" />
            <SlideMenu />

            <div className="feedback-content">
                <h1>💬 Связь с командантом</h1>
                <p className="feedback-description">
                    По всем вопросам, связанным с проживанием в общежитии, вы можете обратиться 
                    к коменданту через эту форму. Мы постараемся ответить вам как можно скорее.
                </p>

                {isSubmitted ? (
                    <div className="success-message">
                        <h2>Спасибо за ваше обращение!</h2>
                        <p>Ваше сообщение уже отправлено. Мы свяжемся с вами в ближайшее время.</p>
                        <button className="new-request-btn" onClick={() => setIsSubmitted(false)}>
                            Написать новое сообщение
                        </button>
                    </div>
                ) : (
                    <form className="feedback-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder=" "
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="name">Ваше имя*</label>
                        </div>

                        <div className="form-group">
                            <input
                                type="text"
                                id="room"
                                name="room"
                                placeholder=" "
                                value={formData.room}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="room">Номер комнаты*</label>
                        </div>

                        <div className="form-group">
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder=" "
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="email">Ваш email*</label>
                        </div>

                        <div className="form-group">
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                placeholder=" "
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="phone">Телефон*</label>
                        </div>

                        <div className="form-group">
                            <select
                                id="category"
                                name="category"
                                placeholder=" "
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                <option value="question">Вопрос</option>
                                <option value="suggestion">Предложение</option>
                                <option value="problem">Проблема</option>
                                <option value="complaint">Жалоба</option>
                                <option value="other">Другое</option>
                            </select>
                            <label htmlFor="category">Тип обращения*</label>
                        </div>

                        <div className="form-group">
                            <textarea
                                id="message"
                                name="message"
                                placeholder=" "
                                value={formData.message}
                                onChange={handleChange}
                                rows="5"
                                required
                            />
                            <label htmlFor="message">Ваше сообщение*</label>
                        </div>
                        <div className="form-footer">
                            <p className="required-fields">* Поля, обязательные для заполнения</p>
                            <button type="submit" className="submit-btn" disabled={isLoading}>
                                {isLoading ? 'Отправка...' : 'Отправить'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="contact-info">
                    <h2>Контакты коменданта</h2>
                    <p><strong>ФИО:</strong> Ожегова Элеонора Зотеевна</p>
                    <p><strong>Телефон:</strong> +7 (950) 945-55-64</p>
                    <p><strong>График работы:</strong> Пн-Пт с 08:00 до 17:00 (обед с 12:00 до 13:00)</p>
                    <p><strong>Кабинет:</strong> 1 этаж, комната 101</p>
                </div>
            </div>
        </div>
    );
};

export default FeedbackPage;