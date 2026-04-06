import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import api, { mockUserId } from '../api';

const Compare: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [runs, setRuns] = useState<any[]>([]);
  
  const [baseRunId, setBaseRunId] = useState('');
  const [targetRunId, setTargetRunId] = useState('');
  const [compareData, setCompareData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
             baseTh: Math.round(d.baseThroughput),
             targetTh: Math.round(d.targetThroughput)
         }))))
         .catch(console.error)
         .finally(() => setLoading(false));
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2.2rem', margin: 0 }}>Compare Runs</h2>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem', display: 'flex', gap: '2rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Application Context</label>
            <select value={selectedApp} onChange={e => {setSelectedApp(e.target.value); setBaseRunId(''); setTargetRunId('');}} style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'var(--text-main)' }}>
                <option value="" style={{color: 'black'}}>-- Select App --</option>
                {applications.map(a => <option key={a.id} value={a.name} style={{color: 'black'}}>{a.name}</option>)}
            </select>
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Baseline Run</label>
            <select value={baseRunId} onChange={e => setBaseRunId(e.target.value)} disabled={!selectedApp} style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'var(--text-main)', opacity: selectedApp ? 1 : 0.5 }}>
                <option value="" style={{color: 'black'}}>-- Select Baseline --</option>
                {runs.map(r => <option key={r.id} value={r.id} style={{color: 'black'}}>{r.applicationVersion} ({new Date(r.uploadTimestamp).toISOString().split('T')[0]})</option>)}
            </select>
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Target Run</label>
            <select value={targetRunId} onChange={e => setTargetRunId(e.target.value)} disabled={!selectedApp} style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'var(--text-main)', opacity: selectedApp ? 1 : 0.5 }}>
                <option value="" style={{color: 'black'}}>-- Select Target --</option>
                {runs.map(r => <option key={r.id} value={r.id} style={{color: 'black'}}>{r.applicationVersion} ({new Date(r.uploadTimestamp).toISOString().split('T')[0]})</option>)}
            </select>
        </div>
        <button className="btn btn-primary" disabled={!baseRunId || !targetRunId || loading} style={{ padding: '1rem 2rem', borderRadius: '12px' }} onClick={handleCompare}>
            {loading ? 'Comparing...' : 'Compare'}
        </button>
      </div>

      {compareData.length > 0 && (
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>Response Time Comparison (ms)</h3>
                <div style={{ height: '400px' }}>
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
            
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>Throughput Comparison (req/s)</h3>
                <div style={{ height: '400px' }}>
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
        </div>
      )}
    </div>
  );
};

export default Compare;
