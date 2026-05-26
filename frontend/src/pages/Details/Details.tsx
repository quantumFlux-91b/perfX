import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Details.css';

export default function Details() {
    const { user } = useAuth();
    const { applicationName, version } = useParams<{ applicationName: string, version: string }>();
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [requestNames, setRequestNames] = useState<string[]>([]);
    const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [allMetricsList, setAllMetricsList] = useState<any[]>([]);

    useEffect(() => {
        if (applicationName && version && user?.id) {
            setLoading(true);
            api.get(`/test-runs?userId=${user.id}&applicationName=${encodeURIComponent(applicationName)}`)
                .then(res => {
                    const runs = res.data;
                    const run = runs.find((r: any) => String(r.applicationVersion) === String(version));
                    if (run && run.timeSeriesMetrics && run.timeSeriesMetrics.length > 0) {
                        const metricsByMinute = new Map<number, any>();
                        const reqNames = new Set<string>();
                        
                        run.timeSeriesMetrics.forEach((m: any) => {
                            reqNames.add(m.requestName);
                            if (!metricsByMinute.has(m.minuteOffset)) {
                                metricsByMinute.set(m.minuteOffset, { 
                                    rawMinute: m.minuteOffset,
                                    minute: `Min ${m.minuteOffset + 1}` 
                                });
                            }
                            const bucket = metricsByMinute.get(m.minuteOffset);
                            bucket[`${m.requestName}_throughput`] = Math.round(m.throughput);
                            bucket[`${m.requestName}_avgRt`] = Math.round(m.avgResponseTime);
                            bucket[`${m.requestName}_p98`] = Math.round(m.percentile98);
                            bucket[`${m.requestName}_errorRate`] = Number((m.errorRate * 100).toFixed(2));
                        });
                        
                        const sortedData = Array.from(metricsByMinute.values())
                            .sort((a: any, b: any) => a.rawMinute - b.rawMinute);
                        
                        setMetrics(sortedData);
                        
                        const uniqueNames = Array.from(reqNames);
                        setRequestNames(uniqueNames);

                        const allMetrics = run.metrics || [];
                        setAllMetricsList(allMetrics);

                        // Select top 5 by throughput if total count is > 5, otherwise select all
                        if (uniqueNames.length > 5) {
                            const top5 = [...allMetrics]
                                .sort((a: any, b: any) => b.throughput - a.throughput)
                                .map((m: any) => m.requestName)
                                .filter(name => uniqueNames.includes(name))
                                .slice(0, 5);
                            setSelectedRequests(top5);
                        } else {
                            setSelectedRequests(uniqueNames);
                        }
                    } else {
                        setMetrics([]);
                        setRequestNames([]);
                        setSelectedRequests([]);
                        setAllMetricsList([]);
                    }
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [applicationName, version, user]);

    if (loading) {
        return <div className="details-loading">Loading details...</div>;
    }

    const COLORS = ['#60a5fa', '#4ade80', '#f59e0b', '#f43f5e', '#a78bfa', '#2dd4bf', '#fb923c', '#38bdf8'];

    const toggleRequest = (name: string) => {
        setSelectedRequests(prev => 
            prev.includes(name) 
                ? prev.filter(n => n !== name) 
                : [...prev, name]
        );
    };

    const selectAll = () => {
        setSelectedRequests(requestNames);
    };

    const clearAll = () => {
        setSelectedRequests([]);
    };

    const selectTop5Throughput = () => {
        const sorted = [...allMetricsList]
            .sort((a: any, b: any) => b.throughput - a.throughput)
            .map((m: any) => m.requestName);
        
        const top5 = sorted.filter(name => requestNames.includes(name)).slice(0, 5);
        setSelectedRequests(top5);
    };

    const selectTop5ResponseTime = () => {
        const sorted = [...allMetricsList]
            .sort((a: any, b: any) => b.avgResponseTime - a.avgResponseTime)
            .map((m: any) => m.requestName);
        
        const top5 = sorted.filter(name => requestNames.includes(name)).slice(0, 5);
        setSelectedRequests(top5);
    };

    const filteredRequestNames = requestNames.filter(name => 
        name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
            <div className="details-header">
                <button 
                    onClick={() => navigate(`/applications/${encodeURIComponent(applicationName || '')}`)}
                    className="btn btn-glass details-back-btn" 
                    title="Back to Dashboard"
                >
                    <span className="details-back-icon">←</span>
                </button>
                <h2 className="details-title">
                    Details: {decodeURIComponent(applicationName || '')} <span className="details-version-label">(Version {version})</span>
                </h2>
            </div>

            {/* Transaction Filter Panel */}
            {requestNames.length > 0 && (
                <div className="glass-panel filter-panel">
                    <div className="filter-header">
                        <h3 className="filter-title">
                            📊 Filter Transactions 
                            <span className="filter-badge">
                                {selectedRequests.length} / {requestNames.length} selected
                            </span>
                        </h3>
                        <div className="filter-actions">
                            <button type="button" className="btn btn-glass filter-btn" onClick={selectTop5Throughput}>Top 5 (Throughput)</button>
                            <button type="button" className="btn btn-glass filter-btn" onClick={selectTop5ResponseTime}>Top 5 (RT)</button>
                            <button type="button" className="btn btn-glass filter-btn" onClick={selectAll}>Select All</button>
                            <button type="button" className="btn btn-glass filter-btn" onClick={clearAll}>Clear All</button>
                        </div>
                    </div>

                    <div className="filter-search-container">
                        <span className="filter-search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search transactions..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="filter-search-input"
                        />
                    </div>

                    <div className="filter-selection-grid">
                        {filteredRequestNames.map(name => {
                            const idx = requestNames.indexOf(name);
                            const isActive = selectedRequests.includes(name);
                            return (
                                <div 
                                    key={`pill-${name}`}
                                    onClick={() => toggleRequest(name)}
                                    className={`filter-pill${isActive ? ' filter-pill--active' : ''}`}
                                >
                                    <span 
                                        className="filter-color-indicator"
                                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                    ></span>
                                    <span>{name}</span>
                                </div>
                            );
                        })}
                        {filteredRequestNames.length === 0 && (
                            <div style={{ color: 'var(--text-muted)', padding: '0.5rem', fontSize: '0.9rem' }}>
                                No transactions match your search.
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            <div className="details-charts-grid">
                {selectedRequests.length > 0 && metrics && metrics.length > 0 ? (
                    <>
                        <div className="glass-panel details-chart-panel">
                            <h3 className="details-chart-heading">Throughput over time (req/s)</h3>
                            <div className="details-chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={metrics} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                        <XAxis dataKey="minute" stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                                        <YAxis stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        {selectedRequests.map((name) => {
                                            const idx = requestNames.indexOf(name);
                                            return (
                                                <Line key={`tp-${name}`} type="monotone" dataKey={`${name}_throughput`} name={name} stroke={COLORS[idx % COLORS.length]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                            );
                                        })}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-panel details-chart-panel">
                            <h3 className="details-chart-heading">Average Response Time over time (ms)</h3>
                            <div className="details-chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={metrics} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                        <XAxis dataKey="minute" stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                                        <YAxis stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        {selectedRequests.map((name) => {
                                            const idx = requestNames.indexOf(name);
                                            return (
                                                <Line key={`avg-${name}`} type="monotone" dataKey={`${name}_avgRt`} name={name} stroke={COLORS[idx % COLORS.length]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                            );
                                        })}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        
                        <div className="glass-panel details-chart-panel">
                            <h3 className="details-chart-heading">98th Percentile over time (ms)</h3>
                            <div className="details-chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={metrics} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                        <XAxis dataKey="minute" stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                                        <YAxis stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        {selectedRequests.map((name) => {
                                            const idx = requestNames.indexOf(name);
                                            return (
                                                <Line key={`p98-${name}`} type="monotone" dataKey={`${name}_p98`} name={name} stroke={COLORS[idx % COLORS.length]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                            );
                                        })}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-panel details-chart-panel">
                            <h3 className="details-chart-heading">Error Rate over time (%)</h3>
                            <div className="details-chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={metrics} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                        <XAxis dataKey="minute" stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                                        <YAxis stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} formatter={(val: any) => `${val}%`} />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        {selectedRequests.map((name) => {
                                            const idx = requestNames.indexOf(name);
                                            return (
                                                <Line key={`err-${name}`} type="monotone" dataKey={`${name}_errorRate`} name={name} stroke={COLORS[idx % COLORS.length]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                            );
                                        })}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="glass-panel details-chart-panel" style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem', textAlign: 'center' }}>
                            {requestNames.length === 0 
                                ? "No time-series data available for this run." 
                                : "Please select at least one transaction from the filter panel above to visualize charts."
                            }
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
