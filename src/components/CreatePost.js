import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import SlideMenu from './SlideMenu';
import api from '../api/api';
import './CreatePost.css';

const CreatePost = () => {
    const [caption, setCaption] = useState('');
    const [image, setImage] = useState(null);
    const [content, setContent] = useState('');
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!caption || !content) {
            setError('Пожалуйста, заполните все поля');
            return;
        }

        const formData = new FormData();
        formData.append('title', caption);
        formData.append('content', content);
        if (image) {
            formData.append('image', image);
        }

        try {
            const response = await api.post('/api/news/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
            });
            console.log('News created: ', response.data);
            navigate('/');
        } catch (error) {
            console.error('Error creating news:', error.response?.data);
            setError(error.response?.data?.title?.[0] || 
                error.response?.data?.content?.[0] || 
                'Произошла ошибка при создании новости');
        }
    };

    return (
        <div className="create-post-container">
            <Header user={null} PageName="новости" />
            <SlideMenu />

            <div className="create-post-content">
                <h1>Добавить новость</h1>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="post-form">
                    <div className="form-group">
                        <input
                            type="text"
                            id="caption"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            required
                        />
                        <label htmlFor="caption">Заголовок:</label>
                    </div>
                    
                    <div className="form-group">
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                        />
                        <label htmlFor="content">Содержимое:</label>
                    </div>

                    <div className="form-group">
                        <input
                            type="file"
                            id="image"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        <label htmlFor="image">Изображение:</label>
                        {preview && (
                            <div className="image-preview">
                                <img src={preview} alt="Предпросмотр" />
                            </div>
                        )}
                    </div>

                    <button type="submit" className="submit-button">Опубликовать</button>
                </form>
            </div>

        </div>
    );
};

export default CreatePost;