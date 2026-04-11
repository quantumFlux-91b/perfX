import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../services/api';
import './ProfileModal.css';

import cheetahImg from '../../assets/avatars/avatar_cheetah.png';
import stopwatchImg from '../../assets/avatars/avatar_stopwatch.png';
import snailImg from '../../assets/avatars/avatar_snail.png';
import rocketImg from '../../assets/avatars/avatar_rocket.png';

const avatars = [
  { id: 'cheetah', src: cheetahImg, alt: 'Fast Cheetah' },
  { id: 'stopwatch', src: stopwatchImg, alt: 'Happy Stopwatch' },
  { id: 'snail', src: snailImg, alt: 'Jetpack Snail' },
  { id: 'rocket', src: rocketImg, alt: 'Flaming Rocket' },
];

interface ProfileModalProps {
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.profilePictureUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial load
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setSelectedAvatar(user.profilePictureUrl || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError('');
    try {
      const updatedUser = await updateUserProfile(user.id, {
        firstName,
        lastName,
        profilePictureUrl: selectedAvatar
      });
      updateUser(updatedUser);
      onClose();
    } catch (err) {
      setError('Failed to update profile. Try again.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content glass-panel animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        {error && <p className="error-message" style={{color: 'red', marginBottom: '1rem'}}>{error}</p>}
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>First Name</label>
            <input 
              type="text" 
              value={firstName} 
              onChange={e => setFirstName(e.target.value)} 
              className="login-input"
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input 
              type="text" 
              value={lastName} 
              onChange={e => setLastName(e.target.value)} 
              className="login-input"
            />
          </div>
          
          <div className="form-group avatar-selection">
            <label>Choose Avatar</label>
            <div className="avatars-grid">
              {avatars.map(avatar => (
                <div 
                  key={avatar.id}
                  className={`avatar-option ${selectedAvatar === avatar.src ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(avatar.src)}
                >
                  <img src={avatar.src} alt={avatar.alt} />
                </div>
              ))}
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-glass" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
