import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { mockUserId } from '../api';

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [appName, setAppName] = useState('');
  const [version, setVersion] = useState('');
  const [tool, setTool] = useState('JMETER');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const app = params.get('application');
    if (app) setAppName(decodeURIComponent(app));
  }, [location]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !appName || !version) return;

    const formData = new FormData();
    formData.append('userId', mockUserId);
    formData.append('applicationName', appName);
    formData.append('applicationVersion', version);
    formData.append('tool', tool);
    formData.append('file', file);

    api.post('/test-runs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(() => {
       navigate(`/applications/${encodeURIComponent(appName)}`);
    }).catch(err => {
       console.error("Upload failed", err);
       alert("Failed to upload the file.");
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '600px' }}>
        <h2 style={{ marginBottom: '2rem', fontSize: '2rem' }}>Upload Test Result</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Application Name</label>
            <input 
              type="text" 
              placeholder="e.g. Payment Gateway" 
              required 
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              readOnly={!!new URLSearchParams(location.search).get('application')}
              style={{ 
                padding: '1rem', 
                borderRadius: '12px', 
                border: '1px solid var(--border)', 
                background: new URLSearchParams(location.search).get('application') ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)', 
                color: new URLSearchParams(location.search).get('application') ? 'var(--text-muted)' : 'white', 
                fontSize: '1rem', 
                outline: 'none',
                cursor: new URLSearchParams(location.search).get('application') ? 'not-allowed' : 'text'
              }} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Version</label>
              <input type="text" placeholder="e.g. v1.2.0" required value={version} onChange={e => setVersion(e.target.value)} style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '1rem', outline: 'none' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Testing Tool</label>
              <select required value={tool} onChange={e => setTool(e.target.value)} style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}>
                <option value="JMETER" style={{color: 'black'}}>JMeter (CSV)</option>
                <option value="K6" style={{color: 'black'}}>K6 (JSON) - Soon</option>
                <option value="GATLING" style={{color: 'black'}}>Gatling - Soon</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Results File</label>
            <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '3rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>📄</span>
                <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ display: 'block' }} id="file-upload" required />
                <label htmlFor="file-upload" style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 'bold' }}>
                  {file ? file.name : 'Click to Browse or Drag & Drop'}
                </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '1rem', fontSize: '1.1rem', marginTop: '1rem', borderRadius: '12px', fontWeight: 600 }}>
             Process & Analyze Upload
          </button>
        </form>
      </div>
    </div>
  );
};

export default Upload;
