import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import './ModerationPanel.css';

const ModerationPanel = () => {
    const [pendingPosts, setPendingPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchPendingPosts();
        }
    }, [user]);

    const fetchPendingPosts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/posts/pending/');
            setPendingPosts(response.data);
        } catch (error) {
            console.error('Error fetching pending posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (postId) => {
        try {
            await api.post(`/api/posts/${postId}/approve/`);
            setPendingPosts(pendingPosts.filter(post => post.id !== postId));
        } catch (error) {
            console.error('Error approving post:', error);
        }
    };

    const handleReject = async (postId) => {
        try {
            await api.delete(`/api/posts/${postId}/reject/`);
            setPendingPosts(pendingPosts.filter(post => post.id !== postId));
        } catch (error) {
            console.error('Error rejecting post:', error);
        }
    };

    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }

    return (
        <div className="moderation-panel">
            <h1>Панель модерации мероприятий</h1>
            <p className="moderation-info">
                Здесь отображаются все мероприятия, ожидающие одобрения. После одобрения они станут видны всем пользователям.
            </p>

            {pendingPosts.length === 0 ? (
                <div className="no-posts">Нет мероприятий для модерации</div>
            ) : (
                <div className="posts-grid">
                    {pendingPosts.map(post => (
                        <div key={post.id} className="post-card">
                            <div className="post-header">
                                <h3>{post.caption}</h3>
                                <span className="author">Автор: @{post.user}</span>
                            </div>
                            
                            {post.image && (
                                <img 
                                    src={post.image} 
                                    alt={post.caption} 
                                    className="post-image"
                                />
                            )}
                            
                            <p className="post-description">{post.description}</p>
                            
                            <div className="post-footer">
                                <span className="post-date">
                                    Создано: {new Date(post.created_at).toLocaleDateString('ru-RU')}
                                </span>
                            </div>
                            
                            <div className="moderation-actions">
                                <button 
                                    className="approve-btn"
                                    onClick={() => handleApprove(post.id)}
                                >
                                    Одобрить
                                </button>
                                <button 
                                    className="reject-btn"
                                    onClick={() => handleReject(post.id)}
                                >
                                    Отклонить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ModerationPanel;