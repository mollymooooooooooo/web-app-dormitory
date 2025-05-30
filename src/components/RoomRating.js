import { React, useState } from "react";
import Header from "./Header";
import SlideMenu from "./SlideMenu";
import { useAuth } from '../context/AuthContext';

import "./RoomRating.css";

const RoomRating = () => {
    const { user } = useAuth();
    const [rooms, setRooms] = useState([
        {
            id: 1,
            room_number: '410',
            building: 'A',
            floor: 4,
            cleanliness_rating: 4.8,
            comfort_rating: 4.5,
            noise_level_rating: 4.2,
            overall_rating: 4.5,
            last_inspection: '2023-05-15',
            photo: '/room_photos/room1.jpg'
        },
        {
            id: 2,
            room_number: '715',
            building: 'A',
            floor: 2,
            cleanliness_rating: 4.9,
            comfort_rating: 4.7,
            noise_level_rating: 4.0,
            overall_rating: 4.6,
            last_inspection: '2023-05-10',
            photo: '/room_photos/room2.jpg'
        },
        {
            id: 3,
            room_number: '312',
            building: 'A',
            floor: 3,
            cleanliness_rating: 4.2,
            comfort_rating: 4.3,
            noise_level_rating: 3.8,
            overall_rating: 4.1,
            last_inspection: '2023-05-12',
            photo: '/room_photos/room3.jpg'
        }
    ]);

    const [floorFilter, setFloorFilter] = useState('');
    const [editingRoom, setEditingRoom] = useState(null);
    const [editForm, setEditForm] = useState({
        cleanliness_rating: '',
        noise_level_rating: '',
        last_inspection: '',
    });

    const handleEditClick = (room) => {
        setEditingRoom(room.id);
        setEditForm({
            cleanliness_rating: room.cleanliness_rating,
            noise_level_rating: room.noise_level_rating,
            last_inspection: room.last_inspection,
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = (roomId) => {
        const updatedRooms = rooms.map(room => {
            if (room.id === roomId) {
                const newOverall = (
                    parseFloat(editForm.cleanliness_rating) + 
                    parseFloat(editForm.noise_level_rating)
                ) / 2;

                return {
                    ...room,
                    cleanliness_rating: parseFloat(editForm.cleanliness_rating),
                    noise_level_rating: parseFloat(editForm.noise_level_rating),
                    overall_rating: newOverall,
                    last_inspection: editForm.last_inspection || new Date().toISOString().split('T')[0]
                };
            }
            return room;
        });
        setRooms(updatedRooms);
        setEditingRoom(null);
    };

    const handleCancel = () => {
        setEditingRoom(null);
    };

    const filteredRooms = rooms.filter(room => {
        const matchesFloor = !floorFilter || room.floor.toString() === floorFilter;
        return matchesFloor;
    });

    return(
        <div className="room-rating-container">
            <Header user={user} PageName="рейтинг" />
            <SlideMenu />
            <div className="room-rating-content">
                <h1>Рейтинг комнат</h1>
                <div className="rating-filters">
                    <select className="filter-select" value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)}>
                        <option value="">Все этажи</option>
                        <option value="2">Этаж 2</option>
                        <option value="3">Этаж 3</option>
                        <option value="4">Этаж 4</option>
                        <option value="5">Этаж 5</option>
                        <option value="6">Этаж 6</option>
                        <option value="7">Этаж 7</option>
                        <option value="8">Этаж 8</option>
                        <option value="9">Этаж 9</option>
                        <option value="10">Этаж 10</option>
                        <option value="11">Этаж 11</option>
                        <option value="12">Этаж 12</option>
                        <option value="13">Этаж 13</option>
                        <option value="14">Этаж 14</option>
                        <option value="15">Этаж 15</option>
                    </select>
                </div>

                <div className="rooms-list">
                    {filteredRooms.map(room => (
                        <div key={room.id} className="room-card">
                            <div className="room-info">
                                <h2>Комната {room.room_number}</h2>
                                <p className="room-location">{room.floor} этаж</p>
                                
                                {editingRoom === room.id && user?.role === 'admin' ? (
                                    <div className="admin-edit-form">
                                        <div className="edit-form-group">
                                            <label>Чистота:</label>
                                            <input
                                                type="number"
                                                name="cleanliness_rating"
                                                min="1"
                                                max="5"
                                                step="0.1"
                                                value={editForm.cleanliness_rating}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="edit-form-group">
                                            <label>Тишина:</label>
                                            <input
                                                type="number"
                                                name="noise_level_rating"
                                                min="1"
                                                max="5"
                                                step="0.1"
                                                value={editForm.noise_level_rating}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="edit-form-group">
                                            <label>Дата проверки:</label>
                                            <input
                                                type="date"
                                                name="last_inspection"
                                                value={editForm.last_inspection}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="edit-buttons">
                                            <button onClick={() => handleSave(room.id)} className="save-btn">Сохранить</button>
                                            <button onClick={handleCancel} className="cancel-btn">Отменить</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                    <div className="rating-bars">
                                        <div className="rating-item">
                                            <span>Чистота:</span>
                                                <div className="rating-bar">
                                                    <div className="rating-fill" style={{width: `${room.cleanliness_rating * 20}%`}}></div>
                                                    <span>{room.cleanliness_rating.toFixed(1)}</span>
                                                </div>
                                        </div>
                                        <div className="rating-item">
                                            <span>Тишина:</span>
                                            <div className="rating-bar">
                                                <div className="rating-fill" style={{width: `${room.noise_level_rating * 20}%`}}></div>
                                                <span>{room.noise_level_rating.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overall-rating">
                                        <span>Общий рейтинг:</span>
                                            <div className="stars">
                                                {'★'.repeat(Math.round(room.overall_rating))}
                                                {'☆'.repeat(5 - Math.round(room.overall_rating))}
                                                <span>({room.overall_rating.toFixed(1)})</span>
                                            </div>
                                    </div>

                                    <p className="inspection-date">Последняя проверка: {new Date(room.last_inspection).toLocaleDateString('ru-RU')}</p>

                                    {user?.role==='admin' && (
                                        <button
                                            onClick={() => handleEditClick(room)}
                                            className="edit-rating-button"
                                        >
                                            Редактировать рейтинг
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    ))}

                    {filteredRooms.length === 0 && (
                        <div className="no-rooms-found">
                            <div className="no-rooms-message">
                                Нет комнат, соответствующих выбранным фильтрам
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoomRating;