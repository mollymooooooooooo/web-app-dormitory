import React from 'react';
import './Header.css';
import LogoutIcon from '../icons/logout.svg';
import { Link } from 'react-router-dom';

const Header = ({ user, PageName }) => {
    return (
        <header className="header-top">
            <Link to="/" className='logo'>Вообще<i>{PageName}</i></Link>
            {user && <p className='username'>@{user.name || user.username}</p>}
            <Link to="/user_login" className='logout-link'>
                <div className='logout-icon'>
                    <img src={LogoutIcon} alt='Выход' />
                </div>
            </Link>
        </header>
    );
};

export default Header;