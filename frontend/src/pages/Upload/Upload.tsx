import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { mockUserId } from '../../services/api';
import './Upload.css';

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [appName, setAppName] = useState('');
  const [version, setVersion] = useState('');
  const [tool, setTool] = useState('JMETER');
  const [dragover, setDragover] = useState(false);

  const isPrefilledApp = !!new URLSearchParams(location.search).get('application');

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
    <div className="animate-fade-in upload-wrapper">
      <div className="glass-panel upload-card">
        <h2 className="upload-title">Upload Test Result</h2>
        
        <form onSubmit={handleSubmit} className="upload-form">
          
          <div className="upload-field">
            <label className="upload-label">Application Name</label>
            <input 
              type="text" 
              placeholder="e.g. Payment Gateway" 
              required 
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              readOnly={isPrefilledApp}
              className={`upload-input${isPrefilledApp ? ' upload-input--readonly' : ''}`}
            />
          </div>

          <div className="upload-row">
            <div className="upload-field">
              <label className="upload-label">Version</label>
              <input type="text" placeholder="e.g. v1.2.0" required value={version} onChange={e => setVersion(e.target.value)} className="upload-input" />
            </div>
            
            <div className="upload-field">
              <label className="upload-label">Testing Tool</label>
              <select required value={tool} onChange={e => setTool(e.target.value)} className="upload-select">
                <option value="JMETER">JMeter (CSV)</option>
                <option value="K6">K6 (JSON) - Soon</option>
                <option value="GATLING">Gatling - Soon</option>
              </select>
            </div>
          </div>

          <div className="upload-field">
            <label className="upload-label">Results File</label>
            {/* Hidden native input */}
            <input
              type="file"
              id="file-upload"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
            {/* Custom dropzone — clicking anywhere triggers the hidden input */}
            <label
              htmlFor="file-upload"
              className={`upload-dropzone${dragover ? ' dragover' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
              onDragLeave={() => setDragover(false)}
              onDrop={(e) => { e.preventDefault(); setDragover(false); const dropped = e.dataTransfer.files?.[0]; if (dropped) setFile(dropped); }}
            >
              <span className="upload-dropzone-icon">📄</span>
              <span className="upload-dropzone-text">
                {file ? file.name : 'Click to Browse or Drag & Drop'}
              </span>
              {file && (
                <span className="upload-dropzone-size">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              )}
            </label>
          </div>

          <button type="submit" className="btn btn-primary upload-submit">
             Process & Analyze Upload
          </button>
        </form>
      </div>
    </div>
  );
};

export default Upload;
