import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginUser, registerUser } from '../../services/api';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login: authenticateUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        const user = await loginUser({ email, password });
        authenticateUser(user);
        navigate('/applications');
      } else {
        const user = await registerUser({ email, password, firstName, lastName });
        authenticateUser(user);
        navigate('/applications');
      }
    } catch (err: any) {
      setError('Authentication failed. Please try again.');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="glass-panel animate-fade-in login-card">
        <div className="login-logo">
            <span className="login-logo-text">PX</span>
        </div>
        <h2 className="login-title">Welcome to PerfX</h2>
        {error && <p className="error-message" style={{color: 'red', textAlign: 'center'}}>{error}</p>}
        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <>
              <input 
                type="text" 
                placeholder="First Name" 
                className="login-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required={!isLogin} 
              />
              <input 
                type="text" 
                placeholder="Last Name" 
                className="login-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required={!isLogin} 
              />
            </>
          )}
          <input 
            type="email" 
            placeholder="Email" 
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          <button type="submit" className="btn btn-primary login-submit">
            {isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>
        <p className="login-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            className="login-toggle-link"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Register' : 'Sign In'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
