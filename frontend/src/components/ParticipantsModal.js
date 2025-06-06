import React from 'react';
import './ParticipantsModal.css';

const ParticipantsModal = ({ participants=[], onClose }) => {
    return (
        <div className="modal-overlay">
            <div className="participants-modal">
                <div className="modal-header">
                    <h2>Участники</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="participants-list">
                    {participants.length > 0 ? (
                        participants.map(user => (
                                <div key={user.id} className="participant-item">
                                <img
                                    src={user.avatar || '/profilepics/default-profile.png'}
                                    alt={user.name}
                                    className="participant-avatar"
                                    
                                />
                                <span className="participant-name">{user.name}</span>
                            </div>
                        ))
                    ) : (
                        <div className="no-participants">
                            Пока нет участников
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParticipantsModal;