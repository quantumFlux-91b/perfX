import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import api, { mockUserId } from '../../services/api';
import './Compare.css';

const Compare: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [runs, setRuns] = useState<any[]>([]);
  
  const [baseRunId, setBaseRunId] = useState('');
  const [targetRunId, setTargetRunId] = useState('');
  const [compareData, setCompareData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const app = params.get('application');
    const base = params.get('baseRunId');
    if (app) setSelectedApp(decodeURIComponent(app));
    if (base) setBaseRunId(base);
  }, [location]);

  useEffect(() => {
      api.get(`/applications?userId=${mockUserId}`).then(res => setApplications(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
      if (selectedApp) {
          api.get(`/test-runs?userId=${mockUserId}&applicationName=${encodeURIComponent(selectedApp)}`)
             .then(res => setRuns(res.data.reverse()))
             .catch(console.error);
      } else {
          setRuns([]);
      }
  }, [selectedApp]);

  const handleCompare = () => {
      if (!baseRunId || !targetRunId) return;
      setLoading(true);
      api.get(`/test-runs/compare?baseRunId=${baseRunId}&targetRunId=${targetRunId}`)
          .then(res => setCompareData(res.data.map((d: any) => ({
              name: d.requestName,
              baseRt: Math.round(d.baseAvgResponseTime),
              targetRt: Math.round(d.targetAvgResponseTime),
              baseTh: Math.round(d.baseThroughput * 100) / 100,
              targetTh: Math.round(d.targetThroughput * 100) / 100,
              baseErr: Math.round(d.baseErrorRate * 10000) / 100,
              targetErr: Math.round(d.targetErrorRate * 10000) / 100,
              baseP98: Math.round(d.baseP98),
              targetP98: Math.round(d.targetP98)
          }))))
         .catch(console.error)
         .finally(() => setLoading(false));
  };

  return (
    <div className="animate-fade-in">
      <div className="compare-header">
        <div className="compare-header-left">
          <button 
            className="btn btn-glass compare-back-btn" 
            onClick={() => navigate(selectedApp ? `/applications/${encodeURIComponent(selectedApp)}` : '/applications')}
            title="Back to Application"
          >
            ←
          </button>
          <h2 className="compare-title">Compare Runs</h2>
        </div>
      </div>

      <div className="glass-panel compare-filters">
        <div className="compare-field">
            <label className="compare-label">Application Context</label>
            <select value={selectedApp} onChange={e => {setSelectedApp(e.target.value); setBaseRunId(''); setTargetRunId('');}} className="compare-select">
                <option value="">-- Select App --</option>
                {applications.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
        </div>
        <div className="compare-field">
            <label className="compare-label">Baseline Run</label>
            <select value={baseRunId} onChange={e => setBaseRunId(e.target.value)} disabled={!selectedApp} className={`compare-select${!selectedApp ? ' compare-select--disabled' : ''}`}>
                <option value="">-- Select Baseline --</option>
                {runs.map(r => <option key={r.id} value={r.id}>{r.applicationVersion} ({new Date(r.uploadTimestamp).toISOString().split('T')[0]})</option>)}
            </select>
        </div>
        <div className="compare-field">
            <label className="compare-label">Target Run</label>
            <select value={targetRunId} onChange={e => setTargetRunId(e.target.value)} disabled={!selectedApp} className={`compare-select${!selectedApp ? ' compare-select--disabled' : ''}`}>
                <option value="">-- Select Target --</option>
                {runs.map(r => <option key={r.id} value={r.id}>{r.applicationVersion} ({new Date(r.uploadTimestamp).toISOString().split('T')[0]})</option>)}
            </select>
        </div>
        <button className="btn btn-primary compare-submit" disabled={!baseRunId || !targetRunId || loading} onClick={handleCompare}>
            {loading ? 'Comparing...' : 'Compare'}
        </button>
      </div>

      {compareData.length > 0 && (
        <div className="animate-fade-in compare-charts">
            <div className="glass-panel compare-chart-panel">
                <h3 className="compare-chart-heading">Response Time Comparison (ms)</h3>
                <div className="compare-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={compareData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis dataKey="name" stroke="var(--text-muted)" />
                            <YAxis stroke="var(--text-muted)" />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="baseRt" name="Baseline RT" fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="targetRt" name="Target RT" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="glass-panel compare-chart-panel">
                <h3 className="compare-chart-heading">P98 Response Time (ms)</h3>
                <div className="compare-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={compareData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis dataKey="name" stroke="var(--text-muted)" />
                            <YAxis stroke="var(--text-muted)" />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="baseP98" name="Baseline P98" fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="targetP98" name="Target P98" fill="var(--warning)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="glass-panel compare-chart-panel">
                <h3 className="compare-chart-heading">Throughput Comparison (req/s)</h3>
                <div className="compare-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={compareData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis dataKey="name" stroke="var(--text-muted)" />
                            <YAxis stroke="var(--text-muted)" />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="baseTh" name="Baseline Throughput" fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="targetTh" name="Target Throughput" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="glass-panel compare-chart-panel">
                <h3 className="compare-chart-heading">Error Rate Comparison (%)</h3>
                <div className="compare-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={compareData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis dataKey="name" stroke="var(--text-muted)" />
                            <YAxis stroke="var(--text-muted)" />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="baseErr" name="Baseline Error %" fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="targetErr" name="Target Error %" fill="var(--error)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Compare;
