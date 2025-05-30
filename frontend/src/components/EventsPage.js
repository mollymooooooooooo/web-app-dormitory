import React, { useState, useEffect, use, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import './EventsPage.css';
import SlideMenu from './SlideMenu';
import Header from './Header';
import NewEventIcon from '../icons/new_event_icon.svg';
import CreateEventModal from './CreateEventModal';
import ParticipantsModal from './ParticipantsModal';
import _ from 'lodash';

const EventsPage = () => {
    const [events, setEvents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);
    const [currentParticipants, setCurrentParticipants] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchApprovedEvents();
    }, []);

    const handleShowParticipants = async (eventId) => {
       try {
            const response = await api.get(`/api/events/${eventId}/subscribers/`);
            console.log('Subscribers data:', response.data);
            setCurrentParticipants(response.data);
            setShowParticipantsModal(true);
        } catch (error) {
            console.error('Error loading participants:', error);
        }
    };

    const handleSubscribe = async (eventId) => {
        try {
        const response = await api.post(`/api/follow-event/${eventId}/`);
        setEvents(events.map(event => {
            if (event.id === eventId) {
                return {
                    ...event,
                    subscribers_count: response.data.subscribers_count || 0,
                    is_subscribed: response.data.following || false,
                    subscribers: response.data.subscribers || []
                };
            }
            return event;
        }));
        } catch (error) {
            console.error('Error subscribing:', error);
        }
    };

    const handleCreateEvent = async (formData) => {
        try {
            const eventData = new FormData();
            eventData.append('caption', formData.title);
            eventData.append('description', formData.description);
            if (formData.image) {
                eventData.append('image', formData.image);
            }

            const response = await api.post('/api/posts/', eventData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setEvents([response.data, ...events]);
            setShowModal(false);
        } catch (error) {
            console.error('Error creating event:', error);
        }
    };

    const fetchApprovedEvents = async () => {
         try {
            setLoading(true);
            const response = await api.get('/api/posts/approved/');
            // Добавляем проверку и значения по умолчанию
            const safeEvents = response.data.map(event => ({
                id: event.id || '',
                caption: event.caption || '',
                description: event.description || '',
                image: event.image || null,
                user: event.user || '',
                created_at: event.created_at || new Date().toISOString(),
                subscribers: event.subscribers || [],
                num_likes: event.num_likes || 0,
                is_subscribed: event.is_subscribed || false
            }));
            setEvents(safeEvents);
        } catch (error) {
            console.error('Error fetching events:', error);
            setError('Не удалось загрузить мероприятия');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async(e) => {
        e.preventDefault();
        try{
            setLoading(true);
            const response = await api.get(`/api/search-events/?q=${encodeURIComponent(searchQuery)}`);

            const searchedEvents = response.data.events.map(event => ({
                id: event.id,
                caption: event.caption,
                description: event.description,
                image: event.image,
                user: event.user,
                created_at: event.created_at,
                subscribers: event.subscribers || [],
                num_likes: event.num_likes || 0,
                is_subscribed: event.is_subscribed || false
            }));
            setEvents(searchedEvents);
            setError(null);
        } catch (error) {
            console.error('Error fetching events:', error);
            setError('Ошибка при поиске мероприятий');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const debouncedSearch = useRef(
        _.debounce(query => {
            if (query.trim()) {
                handleSearch({preventDefault: () => {}});
            } else {
                fetchApprovedEvents();
            }
        }, 500)
    ).current;

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    return (
        <div className="main-container">
            <Header user={user} PageName="мероприятия" />
            <div className="content-wrapper">
                <SlideMenu />
                <div className="content-area">
                    <div className="header-toolbar">
                        <form onSubmit={handleSearch} className="search-form">
                            <input
                                type="text"
                                placeholder="Поиск мероприятий..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            <button type="submit" className='submit-btn'>Найти</button>
                            {searchQuery && (
                                <button
                                    type="button"
                                    className='clear-btn'
                                    onClick={() => {setSearchQuery('');
                                        fetchApprovedEvents();
                                    }}
                                >Очистить</button>
                            )}
                        </form>
                        <div className="create-event-button-wrapper">
                            <button className="create-event-button" onClick={() => {console.log('Кнопка была нажата'); setShowModal(true)}}>
                                <img src={NewEventIcon} alt="Создать мероприятие" />
                                Создать мероприятие
                            </button>
                        </div>
                    </div>

                    <div className="posts-grid">
                        {loading ? (
                            <div> Загрузка мероприятий...</div>
                        ) : error ? (
                            <div className="error-message">{error}</div>
                        ) : events && events.length > 0 ? (
                        events.map(event => (
                            <div key={event.id} className="post-card">
                                <h3>{event.caption}</h3>
                                {event.image && (
                                    <img src={event.image} alt={event.caption} className="post-image" />
                                )}
                                <p>{event.description}</p>
                                <div className="post-footer">
                                    <span>Автор: {event.user}</span>
                                    <span>Дата: {new Date(event.created_at).toLocaleDateString('ru-RU')}</span>
                                    <span>Количество подписчиков: {event.subscribers.length}</span>
                                    <span>Лайков: {event.num_likes}</span>
                                </div>

                                <div className="post-actions">
                                    {event.user !== user.username && (
                                    <button
                                        className={`subscribe-btn ${event.is_subscribed ? 'subscribed' : ''}`}
                                        onClick={() => handleSubscribe(event.id)}
                                    >
                                        {event.is_subscribed ? 'Вы подписаны' : 'Подписаться'}
                                    </button>
                                    )}

                                    <button className="view-participants-btn" onClick={() => handleShowParticipants(event.id)}>
                                        Участники ({event.subscribers.length})
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-message">Нет мероприятий</div>
                    )}
                    </div>

                    {showParticipantsModal && (
                        <ParticipantsModal
                            participants={currentParticipants}
                            onClose={() => setShowParticipantsModal(false)}
                        />
                    )}
                </div>
            </div>

            {showModal && (
                <CreateEventModal onClose={() => setShowModal(false)} onSubmit={handleCreateEvent} />
            )}
        </div>
    );
};

export default EventsPage;