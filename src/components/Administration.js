import React from 'react';
import Header from './Header';
import SlideMenu from './SlideMenu';
import { useAuth } from '../context/AuthContext';
import './Administration.css';

const Administration = () => {
    const { user } = useAuth();
    return (
        <div className="administration-container">
            <Header user={user} PageName="житие" />
            <SlideMenu />

            <div className="administration-content">
                <h1>🏠 АДМИНИСТРАЦИЯ ДОМА №3/1</h1>

                <div className="administration-section">
                    <div className="person-card">
                        <h2>Заведующая домом — Ожегова Элеонора Зотеевна</h2>
                        <div className="schedule">
                            <span>📅 График работы:</span>
                            <p>Пн–Пт с 08:00 до 17:00 (обед — с 12:00 до 13:00)</p>
                        </div>

                        <div className="contacts">
                            <span>📞 Телефон:</span>
                            <a href="tel:+79509455564">+7 (950) 945 55 64</a>
                        </div>
                    </div>

                    <div className="person-card">
                        <h2>Специалист по работе с молодёжью — Шафигуллин Ислам Раифович</h2>
                        <div className="schedule">
                            <span>📅 График работы:</span>
                            <p>Пн - Ср — с 13:00 до 22:00 (обед — с 17:00 до 18:00)</p>
                            <p>Чт - Пт — с 9:00 до 18:00 (обед — с 12:00 до 13:00)</p>
                        </div>

                        <div className="contacts">
                            <span>📞 Телефон:</span>
                            <a href="tel:+79375723605">+7 (937) 572 36 05</a>
                        </div>
                    </div>
                </div>

                <div className="student-council">
                    <h1>👥 СТУДЕНЧЕСКИЙ СОВЕТ ДОМА №3/1</h1>
                    <ul className="council-members">
                        <li><strong>Мансуров Адель</strong> — председатель Студсовета</li>
                        <li><strong>Павлов Владислав</strong> — заместитель председателя</li>
                        <li><strong>Захарова Диана</strong> — староста дома</li>
                        <li><strong>Зарипов Эльдар</strong> — заместитель старосты</li>
                        <li><strong>Низамов Ильнар</strong> — руководитель санитарного сектора</li>
                        <li><strong>Бобошин Иван</strong> — руководитель отдела контроля внутреннего распорядка</li>
                        <li><strong>Загидуллина Алия</strong> — ответственная по делам иностранных студентов</li>
                        <li><strong>Шевченко Богдан</strong> — глава медиацентра</li>
                        <li><strong>Газизова Азалия</strong> — руководитель редколлегии</li>
                        <li><strong>Мошкина Мария</strong> — руководитель благотворительного центра</li>
                        <li><strong>Сучок Анастасия</strong> — культурный организатор</li>
                        <li><strong>Замура Никита</strong> — спортивный организатор</li>
                        <li><strong>Шарапов Булат</strong> — советник при Студсовете</li>
                        <li><strong>Демидов Дмитрий</strong> — советник по техническим вопросам</li>
                    </ul>
                </div>

                <div className="footer-note">
                    <p>💬 По всем вопросам — смело обращайся к нужному человеку. Мы рядом и всегда на связи!</p>
                </div>
            </div>
        </div>
    );
};

export default Administration;