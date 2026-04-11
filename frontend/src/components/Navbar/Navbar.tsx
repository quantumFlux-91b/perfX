import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfileModal from '../ProfileModal/ProfileModal';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email ? user.email.substring(0, 2).toUpperCase() : 'U';
  };

  return (
    <>
      <nav className="glass-panel app-nav">
        <div className="app-nav-brand">
          <div className="app-nav-logo">
            <span className="app-nav-logo-text">PX</span>
          </div>
          <h1 className="app-nav-title">PerfX</h1>
        </div>
        <div className="app-nav-links">
          <Link to="/applications" className="app-nav-link">Applications</Link>
          
          <div className="profile-menu-container">
            <button 
              className="profile-avatar-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {user?.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt="Avatar" className="profile-img" />
              ) : (
                <div className="profile-initials">{getInitials()}</div>
              )}
            </button>
            
            {dropdownOpen && (
              <div className="profile-dropdown glass-panel animate-fade-in">
                <div className="dropdown-user-info">
                  <p className="user-name">{user?.firstName} {user?.lastName}</p>
                  <p className="user-email">{user?.email}</p>
                </div>
                <div className="dropdown-divider"></div>
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    setModalOpen(true);
                  }}
                >
                  Edit Profile
                </button>
                <button 
                  className="dropdown-item logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {modalOpen && <ProfileModal onClose={() => setModalOpen(false)} />}
    </>
  );
};

export default Navbar;
