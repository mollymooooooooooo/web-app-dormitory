import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from "../api/api";
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import SlideMenu from './SlideMenu';
import './Profile.css';

const Profile = () => {
    const { username } = useParams();
    const { user } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [posts, setPosts] = useState([]);
    const [news, setNews] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        bio: '',
        location: '',
        profileimg: null
    });
    const [imagePreview, setImagePreview] = useState('');

    useEffect(() => {
        const fetchData = async () => {
        try {
            const profileResponse = await api.get(`/api/profile/${username}/`);
            setProfileData(profileResponse.data);
            setFormData({
                bio: profileResponse.data.profile.bio || '',
                location: profileResponse.data.profile.location || '',
                profileimg: profileResponse.data.profile.profileimg || null
            });
            
            // Изменяем запрос для получения мероприятий пользователя
            const eventsResponse = await api.get(`/api/posts/?user=${username}`);
            setPosts(eventsResponse.data);
            
            if (profileResponse.data.role === 'admin') {
                const newsResponse = await api.get(`/api/news/?author=${profileResponse.data.id}`);
                setNews(newsResponse.data);
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        };

        fetchData();
    }, [username]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({
                ...prev,
                profileimg: file
            }));
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    try {
        const formDataToSend = new FormData();
        formDataToSend.append('bio', formData.bio);
        formDataToSend.append('location', formData.location);
        if (formData.profileimg && formData.profileimg instanceof File) {
            formDataToSend.append('profileimg', formData.profileimg);
        }

        const response = await api.patch(`/api/profile/${username}/`, formDataToSend, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        // Обновляем данные профиля
        setProfileData(prev => ({
            ...prev,
            profile: {
                ...prev.profile,
                bio: formData.bio,
                location: formData.location,
                profileimg: response.data.profile.profileimg || prev.profile.profileimg
            }
        }));
        
        setIsEditing(false);
        alert('Профиль успешно обновлен!');
    } catch (error) {
        console.error('Error updating profile:', error);
        // Проверяем, есть ли ответ от сервера с дополнительной информацией
        if (error.response && error.response.data && error.response.data.error) {
            alert(`Ошибка при обновлении профиля: ${error.response.data.error}`);
        } else {
            alert('Профиль обновлен, но произошла ошибка при получении ответа');
        }
    }
};

    if (!profileData) return <div className="loading">Загрузка...</div>;

    return (
        <div className="profile-container">
            <Header user={{
                    username: profileData.username,
                    name: profileData.username, // или другое поле с именем
                    avatar: profileData.profile.profileimg,
                    role: profileData.role
                }}  PageName="профиль" />
            <SlideMenu />
            
            <div className="profile-content">
                <div className="profile-header">
                    <div className="profile-info-section">
                        <div className="profile-avatar-container">
                            <img 
                                src={imagePreview || profileData.profile.profileimg || '/profilepics/default-profile.png'} 
                                alt="Аватар" 
                                className="profile-avatar"
                            />
                            {isEditing && (
                                <div className="avatar-upload">
                                    <label htmlFor="profileimg-upload" className="upload-label">
                                        Изменить фото
                                    </label>
                                    <input
                                        id="profileimg-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="profile-basic-info">
                            <h1>{profileData.username}</h1>
                            <p className="user-role">{profileData.role === 'admin' ? 'Администратор' : 'Пользователь'}</p>
                            <p className="user-email">{profileData.email}</p>
                        </div>
                    </div>
                    
                    {user?.username === profileData.username && (
                        <button 
                            onClick={() => setIsEditing(!isEditing)}
                            className="edit-profile-btn"
                        >
                            {isEditing ? 'Отменить' : 'Редактировать профиль'}
                        </button>
                    )}
                </div>

                <div className="profile-details-section">
                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="profile-edit-form">
                            <div className="form-group">
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    rows="4"
                                    placeholder="Расскажите о себе"
                                />
                                <label>О себе:</label>
                            </div>
                            
                            <div className="form-group">
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    placeholder="Город, страна"
                                />
                                <label>Местоположение:</label>
                            </div>
                            
                            <button type="submit" className="save-profile-btn" onClick={handleSubmit}>
                                Сохранить изменения
                            </button>
                        </form>
                    ) : (
                        <>
                            <div className="profile-bio">
                                <h3>О себе</h3>
                                <p>{profileData.profile.bio || 'Пользователь пока ничего не рассказал о себе'}</p>
                            </div>
                            
                            <div className="profile-location">
                                <h3>Местоположение</h3>
                                <p>{profileData.profile.location || 'Не указано'}</p>
                            </div>
                        </>
                    )}
                </div>

                <div className="profile-activity">
                    <div className="activity-section">
                        <h2>Мероприятия</h2>
                        <div className="posts-grid">
                            {posts.length > 0 ? (
                                posts.map(post => (
                                    <div key={post.id} className="post-card">
                                        <h3>{post.caption}</h3>
                                        {post.image && (
                                            <img 
                                                src={post.image} 
                                                alt={post.caption} 
                                                className="post-image"
                                            />
                                        )}
                                        <p>{post.description}</p>
                                        <div className="post-meta">
                                            <span>Дата: {new Date(post.created_at).toLocaleDateString('ru-RU')}</span>
                                            <span>Лайков: {post.num_likes}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>Пользователь еще не создавал мероприятия</p>
                            )}
                        </div>
                    </div>
                    
                    {profileData.role === 'admin' && (
                        <div className="activity-section">
                            <h2>Новости</h2>
                            <div className="news-list">
                                {news.length > 0 ? (
                                    news.map(item => (
                                        <div key={item.id} className="news-item-profile">
                                            {item.image && <img src={item.image} alt={item.title} />}
                                            <div className="news-content">
                                                <h3>{item.title}</h3>
                                                <p>{new Date(item.created_at).toLocaleDateString('ru-RU')}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p>Новостей пока нет</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;