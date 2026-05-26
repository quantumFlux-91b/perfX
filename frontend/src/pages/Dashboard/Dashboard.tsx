import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api, { toggleFavoriteApp } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { applicationName } = useParams<{ applicationName: string }>();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!applicationName) {
      if (user?.id) {
        api.get(`/applications?userId=${user.id}`).then(res => setApplications(res.data)).catch(console.error);
      }
    } else {
      if (user?.id) {
        api.get(`/test-runs?userId=${user.id}&applicationName=${encodeURIComponent(applicationName)}`)
         .then(res => {
             const sorted = res.data.sort((a: any, b: any) => new Date(a.uploadTimestamp).getTime() - new Date(b.uploadTimestamp).getTime());
             const processed = sorted.map((r: any) => {
                 let avgRt = 0;
                 let throughput = 0;
                 let errorRate = 0;

                 if (r.metrics && r.metrics.length > 0) {
                     const totalThroughput = r.metrics.reduce((acc: number, m: any) => acc + m.throughput, 0);
                     throughput = Math.round(totalThroughput);

                     if (totalThroughput > 0) {
                         const totalRtWeighted = r.metrics.reduce((acc: number, m: any) => acc + (m.avgResponseTime * m.throughput), 0);
                         avgRt = Math.round(totalRtWeighted / totalThroughput);

                         const totalErWeighted = r.metrics.reduce((acc: number, m: any) => acc + (m.errorRate * m.throughput), 0);
                         errorRate = Number(((totalErWeighted / totalThroughput) * 100).toFixed(2));
                     } else {
                         const sumRt = r.metrics.reduce((acc: number, m: any) => acc + m.avgResponseTime, 0);
                         avgRt = Math.round(sumRt / r.metrics.length);

                         const sumEr = r.metrics.reduce((acc: number, m: any) => acc + m.errorRate, 0);
                         errorRate = Number(((sumEr / r.metrics.length) * 100).toFixed(2));
                     }
                 }
                 
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
    }
  }, [applicationName, user]);

  const handleCreateApp = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newAppName.trim()) return;
      api.post(`/applications?userId=${user?.id}&name=${encodeURIComponent(newAppName)}`)
         .then(() => {
             setShowCreateModal(false);
             setNewAppName('');
             navigate(`/applications/${encodeURIComponent(newAppName)}`);
         })
         .catch(_err => alert("Failed to create app. Name might already exist."));
  };

  const handleToggleFavorite = (e: React.MouseEvent, appId: string) => {
      e.stopPropagation();
      setApplications(prev => prev.map(app => app.id === appId ? { ...app, favorite: !app.favorite } : app));
      toggleFavoriteApp(appId).catch(console.error);
  };

  const displayedApplications = applications.filter(app => {
      const matchFav = showFavoritesOnly ? app.favorite : true;
      const matchSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchFav && matchSearch;
  });

  if (!applicationName) {
      return (
        <div className="animate-fade-in app-selector">
          <div className="app-selector-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem', width: '100%' }}>
             <h2 className="app-selector-title" style={{ marginBottom: 0 }}>Select an Application</h2>
             
             <div className="app-filters" style={{ 
                 display: 'flex', 
                 alignItems: 'center', 
                 gap: '1rem', 
                 background: 'rgba(255, 255, 255, 0.05)', 
                 padding: '0.8rem 1.5rem', 
                 borderRadius: '30px', 
                 border: '1px solid var(--border)', 
                 width: '100%', 
                 maxWidth: '450px',
                 boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
             }}>
                 <span style={{ color: 'var(--text-muted)' }}>🔍</span>
                 <input 
                     type="text" 
                     placeholder="Search application by name..." 
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)} 
                     style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '1rem' }}
                 />
                 
                 <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>

                 <div 
                     onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                     style={{ 
                         cursor: 'pointer', 
                         fontSize: '1.4rem', 
                         color: showFavoritesOnly ? '#fbbf24' : 'var(--text-muted)',
                         display: 'flex', 
                         alignItems: 'center', 
                         justifyContent: 'center',
                         transition: 'color 0.2s, transform 0.2s',
                         transform: showFavoritesOnly ? 'scale(1.1)' : 'scale(1)'
                     }}
                     title={showFavoritesOnly ? "Show All Applications" : "Show Favorites Only"}
                 >
                     {showFavoritesOnly ? '★' : '☆'}
                 </div>
             </div>
          </div>
          
          {displayedApplications.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No applications found matching your filters.
              </div>
          )}

          <div className="app-selector-grid">
            {displayedApplications.map(app => (
              <div 
                key={app.id} 
                className="glass-panel app-card" 
                onClick={() => navigate(`/applications/${encodeURIComponent(app.name)}`)}
                style={{ position: 'relative' }}
              >
                <div 
                    className="favorite-star" 
                    onClick={(e) => handleToggleFavorite(e, app.id)}
                    style={{ 
                        position: 'absolute', top: '10px', right: '10px', 
                        cursor: 'pointer', fontSize: '1.2rem',
                        color: app.favorite ? '#fbbf24' : 'var(--text-muted)',
                        transition: 'color 0.2s, transform 0.2s',
                        transform: app.favorite ? 'scale(1.1)' : 'scale(1)'
                    }}
                    title={app.favorite ? 'Remove from favorites' : 'Mark as favorite'}
                >
                    {app.favorite ? '★' : '☆'}
                </div>
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
