import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/applications');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: '50%', margin: '0 auto 2.5rem', boxShadow: 'var(--shadow-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{color: 'white', fontWeight: '900', fontSize: '1.8rem', letterSpacing: '1px'}}>PX</span>
        </div>
        <h2 style={{ marginBottom: '2.5rem', fontSize: '2rem' }}>Welcome to PerfX</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <input 
            type="text" 
            placeholder="Username" 
            style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'white', width: '100%', fontSize: '1rem', outline: 'none', transition: 'border 0.2s' }}
            onFocus={(e) => e.target.style.border = '1px solid var(--primary)'}
            onBlur={(e) => e.target.style.border = '1px solid var(--border)'}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'white', width: '100%', fontSize: '1rem', outline: 'none', transition: 'border 0.2s' }}
            onFocus={(e) => e.target.style.border = '1px solid var(--primary)'}
            onBlur={(e) => e.target.style.border = '1px solid var(--border)'}
            required 
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '1rem', fontSize: '1.1rem', marginTop: '1rem', borderRadius: '12px', fontWeight: 600 }}>
            {isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>
        <p style={{ marginTop: '2.5rem', color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }} 
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
