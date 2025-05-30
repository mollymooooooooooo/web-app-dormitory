import React, { useState } from 'react';
import './SlideMenu.css';
import NewsIcon from '../icons/news.svg';
import ProfileIcon from '../icons/profile.svg';
import EventsIcon from '../icons/events.svg';
import RatingIcon from '../icons/rating.svg';
import AdministrationIcon from '../icons/administration.svg';
import FeedbackIcon from '../icons/feedback.svg';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SlideMenu = () => {
    const [expanded, setExpanded] = useState(false);
    const { user } = useAuth();

    const menuItems = [
        { icon: NewsIcon, title: 'Новости', path: '/' },
        { icon: ProfileIcon, title: 'Профиль', path: user ? `/profile/${user.username}` : '/login' },
        { icon: EventsIcon, title: 'Мероприятия', path: '/explore' },
        { icon: RatingIcon, title: 'Рейтинг комнат', path: '/rating' },
        { icon: AdministrationIcon, title: 'Администрация', path: '/administration' },
        { icon: FeedbackIcon, title: 'Связь с комендантом', path: '/feedback' },
    ];

    return (
        <div
            className={`slide-menu ${expanded ? 'expanded' : ''}`}
            onMouseEnter={ () => setExpanded(true) }
            onMouseLeave={ () => setExpanded(false) }
            >
                <div className="menu-items">
                    {menuItems.map((item, index) => (
                        <Link
                            key={index}
                            to={item.path}
                            className="menu-item"
                            >
                                <div className="menu-icon">
                                    <img src={item.icon} alt={item.title} className='svg-icon' />
                                </div>
                                <span className="menu-title">{item.title}</span>
                            </Link>
                    ))}
                </div>
            </div>
    );
};

export default SlideMenu;