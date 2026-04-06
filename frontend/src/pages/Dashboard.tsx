import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api, { mockUserId } from '../api';

const Dashboard: React.FC = () => {
  const { applicationName } = useParams<{ applicationName: string }>();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!applicationName) {
      api.get(`/applications?userId=${mockUserId}`).then(res => setApplications(res.data)).catch(console.error);
    } else {
      api.get(`/test-runs?userId=${mockUserId}&applicationName=${encodeURIComponent(applicationName)}`)
         .then(res => {
             const sorted = res.data.sort((a: any, b: any) => new Date(a.uploadTimestamp).getTime() - new Date(b.uploadTimestamp).getTime());
             const processed = sorted.map((r: any) => {
                 const avgRt = r.metrics && r.metrics.length > 0 ? Math.round(r.metrics[0].avgResponseTime) : 0;
                 const throughput = r.metrics && r.metrics.length > 0 ? Math.round(r.metrics[0].throughput) : 0;
                 const errorRate = r.metrics && r.metrics.length > 0 ? Number((r.metrics.reduce((acc: number, m: any) => acc + m.errorRate, 0) / r.metrics.length * 100).toFixed(2)) : 0;
                 
                 return {
                     id: r.id,
                     version: r.applicationVersion,
                     date: new Date(r.uploadTimestamp).toISOString().split('T')[0],
                     avgRt,
                     throughput,
                     errorRate
                 };
             });
             setRuns(processed);
             setCurrentPage(1);
         })
         .catch(console.error);
    }
  }, [applicationName]);

  const handleCreateApp = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newAppName.trim()) return;
      api.post(`/applications?userId=${mockUserId}&name=${encodeURIComponent(newAppName)}`)
         .then(() => {
             setShowCreateModal(false);
             setNewAppName('');
             navigate(`/applications/${encodeURIComponent(newAppName)}`);
         })
         .catch(err => alert("Failed to create app. Name might already exist."));
  };

  if (!applicationName) {
      return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>Select an Application</h2>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {applications.map(app => (
              <div 
                key={app.id} 
                className="glass-panel" 
                style={{ padding: '2.5rem', width: '300px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s', border: '1px solid var(--border)' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                onClick={() => navigate(`/applications/${encodeURIComponent(app.name)}`)}
              >
                <div style={{ width: '60px', height: '60px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '50%', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  📦
                </div>
                <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{app.name}</h3>
              </div>
            ))}
            <div 
                className="glass-panel" 
                style={{ padding: '2.5rem', width: '300px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s', border: '1px dashed var(--primary)', background: 'rgba(59, 130, 246, 0.05)' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                onClick={() => setShowCreateModal(true)}
              >
                <div style={{ width: '60px', height: '60px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '50%', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--primary)' }}>
                  +
                </div>
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--primary)' }}>New Application</h3>
            </div>
          </div>

          {showCreateModal && (
            <div className="animate-fade-in" style={{position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
               <div className="glass-panel" style={{padding: '3rem', width: '100%', maxWidth: '400px'}}>
                 <h3 style={{marginBottom: '2rem', fontSize: '1.5rem'}}>Create New Application</h3>
                 <form onSubmit={handleCreateApp}>
                    <input autoFocus type="text" placeholder="Application Name" value={newAppName} onChange={e => setNewAppName(e.target.value)} required style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'white', width: '100%', marginBottom: '2rem', outline: 'none' }} />
                    <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
                       <button type="button" className="btn btn-glass" onClick={() => setShowCreateModal(false)}>Cancel</button>
                       <button type="submit" className="btn btn-primary" style={{borderRadius: '8px'}}>Create</button>
                    </div>
                 </form>
               </div>
            </div>
          )}
        </div>
      );
  }

  const tableRuns = [...runs].reverse();
  const totalPages = Math.max(1, Math.ceil(tableRuns.length / 10));
  const paginatedRuns = tableRuns.slice((currentPage - 1) * 10, currentPage * 10);

  const getTrendIcon = (run: any, type: 'rt' | 'tp' | 'er') => {
    const currentIndex = tableRuns.findIndex(r => r.id === run.id);
    if (currentIndex === -1 || currentIndex === tableRuns.length - 1) return null;

    const prevRun = tableRuns[currentIndex + 1];
    const current = type === 'rt' ? run.avgRt : type === 'tp' ? run.throughput : run.errorRate;
    const prev = type === 'rt' ? prevRun.avgRt : type === 'tp' ? prevRun.throughput : prevRun.errorRate;

    if (Math.abs(current - prev) < 0.01) return <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 'bold' }}>=</span>;

    if (type === 'tp') {
        return current > prev 
            ? <span style={{ color: 'var(--success)', marginLeft: '0.5rem', fontWeight: 'bold' }}>↑</span> 
            : <span style={{ color: 'var(--error)', marginLeft: '0.5rem', fontWeight: 'bold' }}>↓</span>;
    } else {
        return current < prev 
            ? <span style={{ color: 'var(--success)', marginLeft: '0.5rem', fontWeight: 'bold' }}>↓</span> 
            : <span style={{ color: 'var(--error)', marginLeft: '0.5rem', fontWeight: 'bold' }}>↑</span>;
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2.2rem', margin: 0 }}>Dashboard: {decodeURIComponent(applicationName)}</h2>
        <Link to={`/upload?application=${applicationName}`} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px' }}>
            + New Upload
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '1.2rem' }}>Response Time Evolution (ms)</h3>
            <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={runs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="version" stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
                    <Line type="monotone" dataKey="avgRt" stroke="var(--primary)" strokeWidth={3} dot={{ r: 6, fill: 'var(--bg-base)', strokeWidth: 2 }} activeDot={{ r: 8, fill: 'var(--primary)' }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '1.2rem' }}>Throughput Evolution (req/s)</h3>
            <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={runs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="version" stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
                    <Line type="monotone" dataKey="throughput" stroke="var(--accent)" strokeWidth={3} dot={{ r: 6, fill: 'var(--bg-base)', strokeWidth: 2 }} activeDot={{ r: 8, fill: 'var(--accent)' }} />
                    </LineChart>
                </ResponsiveContainer>
                </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '1.2rem' }}>Error Rate (%)</h3>
            <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={runs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="version" stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
                    <Line type="monotone" dataKey="errorRate" stroke="var(--error)" strokeWidth={3} dot={{ r: 6, fill: 'var(--bg-base)', strokeWidth: 2 }} activeDot={{ r: 8, fill: 'var(--error)' }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Test Runs</h3>
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-muted)' }}>Version</th>
              <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-muted)' }}>Date</th>
              <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-muted)' }}>Avg Response Time</th>
              <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-muted)' }}>Throughput</th>
              <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-muted)' }}>Error Rate</th>
              <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRuns.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No test runs uploaded yet. Start by creating a New Upload!</td>
              </tr>
            )}
            {paginatedRuns.map((run) => (
              <tr key={run.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '1.25rem 1.5rem', fontWeight: 500 }}>{run.version}</td>
                <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)' }}>{run.date}</td>
                <td style={{ padding: '1.25rem 1.5rem', color: 'var(--success)' }}>
                  {run.avgRt} ms {getTrendIcon(run, 'rt')}
                </td>
                <td style={{ padding: '1.25rem 1.5rem', color: 'var(--accent)' }}>
                  {run.throughput} r/s {getTrendIcon(run, 'tp')}
                </td>
                <td style={{ padding: '1.25rem 1.5rem', color: 'var(--error)' }}>
                  {run.errorRate}% {getTrendIcon(run, 'er')}
                </td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <button onClick={() => navigate(`/applications/${encodeURIComponent(applicationName || '')}/${run.version}/details`)} className="btn btn-glass" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', borderRadius: '20px' }}>Details</button>
                  <button className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', borderRadius: '20px', marginLeft: '0.5rem' }} onClick={() => navigate(`/compare?application=${encodeURIComponent(applicationName)}&baseRunId=${run.id}`)}>Compare</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
          <button 
            className="btn btn-glass" 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}
          >
            Previous
          </button>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button 
            className="btn btn-glass" 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
