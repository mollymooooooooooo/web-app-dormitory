import React, { useState, useEffect, use } from 'react';
import axios from 'axios';
import Header from './Header';
import SlideMenu from './SlideMenu';
import './MainPage.css';
import api from '../api/api';

const MainPage = () => {
    const[ news, setNews ] = useState([]);
    const [ isAdmin, setIsAdmin ] = useState(false);
    const [ user, setUser ] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
        try {
            // Добавляем логирование для отладки
            console.log("Fetching user data...");
            
            const userResponse = await api.get('/user/profile/');
            console.log("User data:", userResponse.data);
            
            setUser(userResponse.data);
            setIsAdmin(userResponse.data.role === 'admin');
            
            console.log("Is admin:", userResponse.data.role === 'admin');
            
            const newsResponse = await api.get('/api/news/');
            setNews(newsResponse.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
}, []);

    const handleDelete = async (newsId) => {
        try {
            await api.delete(`/api/news/${newsId}/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            setNews(prev => prev.filter(item => item.id !== newsId));
        } catch (error) {
            console.error('Error deleting news:', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="news-feed-container">
            <Header user={user} PageName="новости" />
            <SlideMenu />

            <div className="news-feed-content">

                {isAdmin && (
                    <button className="add-news-button" onClick={() => window.location.href = '/create_news'}>
                        Добавить новость
                    </button>
                )}

                <div className="news-list">
                    {news.length>0 ? (
                        news.map((item, index) => (
                        <React.Fragment key={item.id}>
                            <div className="news-item">
                                <div className="news-image-container">
                                    <img src={item.image} alt={item.title} className="news-image" />
                                </div>
                                <div className="news-content">
                                    <h2 className="news-title">{item.title}</h2>
                                    <p className="news-description">{item.content}</p>
                                    <div className="news-meta">
                                        <span className="news-date">
                                            {new Date(item.created_at).toLocaleDateString('ru-RU', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                        <span className="news-author">@{item.author?.username || 'Администрация'}</span>
                                    </div>
                                    { isAdmin && (
                                        <button className="delete-post-button" onClick={() => handleDelete(item.id)}>
                                            Удалить
                                        </button>
                                    )}
                                </div>
                            </div>
                            {index < item.length - 1 && <div className="news-divider"></div>}
                        </React.Fragment>
                    ))
                    ) : (
                        <div className="empty-message"> <h2>Нет новостей</h2></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MainPage;
