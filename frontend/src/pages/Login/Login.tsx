import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/applications');
  };

  return (
    <div className="login-wrapper">
      <div className="glass-panel animate-fade-in login-card">
        <div className="login-logo">
            <span className="login-logo-text">PX</span>
        </div>
        <h2 className="login-title">Welcome to PerfX</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <input 
            type="text" 
            placeholder="Username" 
            className="login-input"
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="login-input"
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
