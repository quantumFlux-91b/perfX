import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api, { mockUserId } from '../../services/api';
import './Dashboard.css';

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
         .catch(_err => alert("Failed to create app. Name might already exist."));
  };

  if (!applicationName) {
      return (
        <div className="animate-fade-in app-selector">
          <h2 className="app-selector-title">Select an Application</h2>
          <div className="app-selector-grid">
            {applications.map(app => (
              <div 
                key={app.id} 
                className="glass-panel app-card" 
                onClick={() => navigate(`/applications/${encodeURIComponent(app.name)}`)}
              >
                <div className="app-card-icon">
                  📦
                </div>
                <h3 className="app-card-name">{app.name}</h3>
              </div>
            ))}
            <div 
                className="glass-panel app-card--new" 
                onClick={() => setShowCreateModal(true)}
              >
                <div className="app-card-icon">
                  +
                </div>
                <h3 className="app-card-name">New Application</h3>
            </div>
          </div>

          {showCreateModal && createPortal(
            <div className="animate-fade-in modal-overlay" onClick={() => setShowCreateModal(false)}>
               <div className="modal-content" onClick={e => e.stopPropagation()}>
                 <h3 className="modal-title">Create New Application</h3>
                 <form onSubmit={handleCreateApp}>
                    <input autoFocus type="text" placeholder="Application Name" value={newAppName} onChange={e => setNewAppName(e.target.value)} required className="modal-input" />
                    <div className="modal-actions">
                       <button type="button" className="btn btn-glass" onClick={() => setShowCreateModal(false)}>Cancel</button>
                       <button type="submit" className="btn btn-primary modal-create-btn">Create</button>
                    </div>
                 </form>
               </div>
            </div>,
            document.body
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

    if (Math.abs(current - prev) < 0.01) return <span className="trend-icon trend-icon--neutral">=</span>;

    if (type === 'tp') {
        return current > prev 
            ? <span className="trend-icon trend-icon--positive">↑</span> 
            : <span className="trend-icon trend-icon--negative">↓</span>;
    } else {
        return current < prev 
            ? <span className="trend-icon trend-icon--positive">↓</span> 
            : <span className="trend-icon trend-icon--negative">↑</span>;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Dashboard: {decodeURIComponent(applicationName)}</h2>
        <Link to={`/upload?application=${applicationName}`} className="btn btn-primary dashboard-upload-link">
            + New Upload
        </Link>
      </div>

      <div className="charts-grid">
        <div className="glass-panel chart-panel">
            <h3 className="chart-heading">Response Time Evolution (ms)</h3>
            <div className="chart-container">
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

        <div className="glass-panel chart-panel">
            <h3 className="chart-heading">Throughput Evolution (req/s)</h3>
            <div className="chart-container">
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

        <div className="glass-panel chart-panel">
            <h3 className="chart-heading">Error Rate (%)</h3>
            <div className="chart-container">
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

      <h3 className="table-heading">Test Runs</h3>
      <div className="glass-panel table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Version</th>
              <th>Date</th>
              <th>Avg Response Time</th>
              <th>Throughput</th>
              <th>Error Rate</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRuns.length === 0 && (
              <tr>
                <td colSpan={6} className="td-empty">No test runs uploaded yet. Start by creating a New Upload!</td>
              </tr>
            )}
            {paginatedRuns.map((run) => (
              <tr key={run.id}>
                <td className="td-version">{run.version}</td>
                <td className="td-date">{run.date}</td>
                <td className="td-rt">
                  {run.avgRt} ms {getTrendIcon(run, 'rt')}
                </td>
                <td className="td-throughput">
                  {run.throughput} r/s {getTrendIcon(run, 'tp')}
                </td>
                <td className="td-error">
                  {run.errorRate}% {getTrendIcon(run, 'er')}
                </td>
                <td>
                  <button onClick={() => navigate(`/applications/${encodeURIComponent(applicationName || '')}/${run.version}/details`)} className="btn btn-glass action-btn">Details</button>
                  <button className="btn btn-primary action-btn action-btn--compare" onClick={() => navigate(`/compare?application=${encodeURIComponent(applicationName)}&baseRunId=${run.id}`)}>Compare</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="btn btn-glass pagination-btn" 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            className="btn btn-glass pagination-btn" 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
