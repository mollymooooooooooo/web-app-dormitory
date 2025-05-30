import React, { useState, useRef } from 'react';
import './CreateEventModal.css';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const CreateEventModal = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image: null,
        useGeneratedImage: false
    });
    const [fileName, setFileName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const fileInputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { 
                setError('Размер файла не должен превышать 5MB');
                return;
            }
            setError('');
            setFormData(prev => ({ ...prev, image: file, useGeneratedImage: false }));
            setFileName(file.name);
        }
    };

    const handleCustomUploadClick = () => {
        fileInputRef.current.click();
    }

    const generateAIImage = async () => {
        try {
            setIsGeneratingImage(true);
            setError('');

            if (!formData.title.trim()) {
                throw new Error('Заголовок не может быть пустым');
            }

            console.log('Sending request with:', {
                prompt: formData.title,
                description: formData.description
            });

            const response = await api.post('/api/ai/generate_image/', {
                prompt: formData.title,
                description: formData.description
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.data?.image) {
                throw new Error('Неверный формат ответа от сервера');
            }

            const byteCharacters = atob(response.data.image);
            const byteNumbers = new Array(byteCharacters.length);
            
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });
            const file = new File([blob], 'ai-generated.png', { type: 'image/png' });

            setFormData(prev => ({ ...prev, image: file, useGeneratedImage: true }));
            setFileName('Сгенерировано ИИ');
        } catch (err) {
            console.error('Error generating image:', err);
            setError('Ошибка при генерации изображения ИИ');
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const postData = new FormData();
            postData.append('caption', formData.title);
            postData.append('description', formData.description);
            if (!formData.image && !formData.useGeneratedImage) {
                await generateAIImage();
            }
            if (formData.image) {
                postData.append('image', formData.image);
                postData.append('is_ai_generated', formData.useGeneratedImage);
            }

            const response = await api.post('/api/posts/create/', postData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const isAdmin = user?.role === 'admin';
            onSubmit(isAdmin ? response.data : null);
            alert(isAdmin 
                ? 'Мероприятие создано и опубликовано!' 
                : 'Мероприятие создано и отправлено на модерацию. Вы получите уведомление после проверки.');
            
            onClose();
        } catch (err) {
            console.error('Error creating event:', err);
            setError(err.response?.data?.error || 'Ошибка при создании мероприятия');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-button" onClick={onClose}>&times;</button>
                <h2>Создать мероприятие</h2>

                {error && <div className="error-message">{error}</div>}

                {user?.role==='admin' && (
                    <div className="admin-notice">
                        Вы администратор: мероприятие будет опубликовано сразу
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <div className="custom-upload-container">
                            <input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} style={{display: 'none'}}/>
                            <div className="custom-upload-button" onClick={handleCustomUploadClick}>
                                {fileName || "Добавьте фото или ИИ сгенерирует фото за вас"}
                            </div>
                            {fileName && (
                                <div className="file-info">
                                    <span>{fileName}</span>
                                    <button type="button" className="clear-file-btn" onClick={() => {
                                        setFormData(prev => ({ ...prev, image: null, useGeneratedImage: false }));
                                        setFileName('');
                                    }}
                                    >
                                        ×
                                </button>
                             </div>
                            )}
                        </div>
                        {!fileName && (
                            <button 
                                type="button"
                                className="generate-ai-btn"
                                onClick={generateAIImage}
                                disabled={isGeneratingImage}
                            >
                                {isGeneratingImage ? 'Генерируем ИИ...' : 'Сгенерировать ИИ'}
                            </button>
                        )}
                    </div>

                    <div className="form-group">
                        <input type="text" placeholder="" name="title" value={formData.title} onChange={handleChange} required/>
                        <label>Заголовок:</label>
                        <span className="char-counter">{formData.title.length}/100</span>
                    </div>

                    <div className="form-group">
                        <textarea name="description" placeholder=" " value={formData.description} onChange={handleChange} required/>
                        <label>Описание:</label>
                        <span className="char-counter">{formData.description.length}/500</span>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="cancel-button" onClick={onClose}>Отмена</button>
                        <button type="submit" className="submit-button" disabled={isSubmitting}>
                            {isSubmitting ? 'Отправляется...' : 'Опубликовать'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEventModal;