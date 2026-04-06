import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import api, { mockUserId } from '../api';

export default function Details() {
    const { applicationName, version } = useParams<{ applicationName: string, version: string }>();
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [requestNames, setRequestNames] = useState<string[]>([]);

    useEffect(() => {
        if (applicationName && version) {
            setLoading(true);
            api.get(`/test-runs?userId=${mockUserId}&applicationName=${encodeURIComponent(applicationName)}`)
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
                        setRequestNames(Array.from(reqNames));
                    } else {
                        setMetrics([]);
                        setRequestNames([]);
                    }
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [applicationName, version]);

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>Loading details...</div>;
    }

    const COLORS = ['#60a5fa', '#4ade80', '#f59e0b', '#f43f5e', '#a78bfa', '#2dd4bf', '#fb923c', '#38bdf8'];

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2.5rem', gap: '1rem' }}>
                <button 
                    onClick={() => navigate(`/applications/${encodeURIComponent(applicationName || '')}`)}
                    className="btn btn-glass" 
                    style={{ padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}
                    title="Back to Dashboard"
                >
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>←</span>
                </button>
                <h2 style={{ fontSize: '2.2rem', margin: 0 }}>
                    Details: {decodeURIComponent(applicationName || '')} <span style={{ color: 'var(--text-muted)', fontSize: '1.5rem', fontWeight: 'normal' }}>(Version {version})</span>
                </h2>
            </div>
            
            <div style={{ display: 'grid', gap: '3rem' }}>
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '2rem', color: 'var(--text)', fontWeight: 500, fontSize: '1.4rem' }}>Throughput over time (req/s)</h3>
                    <div style={{ height: '350px' }}>
                        {metrics && metrics.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={metrics} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis dataKey="minute" stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                {requestNames.map((name, idx) => (
                                    <Line key={`tp-${name}`} type="monotone" dataKey={`${name}_throughput`} name={name} stroke={COLORS[idx % COLORS.length]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available to display in graph.</div>
                        )}
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '2rem', color: 'var(--text)', fontWeight: 500, fontSize: '1.4rem' }}>Average Response Time over time (ms)</h3>
                    <div style={{ height: '350px' }}>
                        {metrics && metrics.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={metrics} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis dataKey="minute" stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                {requestNames.map((name, idx) => (
                                    <Line key={`avg-${name}`} type="monotone" dataKey={`${name}_avgRt`} name={name} stroke={COLORS[idx % COLORS.length]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available to display in graph.</div>
                        )}
                    </div>
                </div>
                
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '2rem', color: 'var(--text)', fontWeight: 500, fontSize: '1.4rem' }}>98th Percentile over time (ms)</h3>
                    <div style={{ height: '350px' }}>
                        {metrics && metrics.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={metrics} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis dataKey="minute" stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                {requestNames.map((name, idx) => (
                                    <Line key={`p98-${name}`} type="monotone" dataKey={`${name}_p98`} name={name} stroke={COLORS[idx % COLORS.length]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available to display in graph.</div>
                        )}
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '2rem', color: 'var(--text)', fontWeight: 500, fontSize: '1.4rem' }}>Error Rate over time (%)</h3>
                    <div style={{ height: '350px' }}>
                        {metrics && metrics.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={metrics} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis dataKey="minute" stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="var(--text-muted)" tickMargin={10} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} formatter={(val: any) => `${val}%`} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                {requestNames.map((name, idx) => (
                                    <Line key={`err-${name}`} type="monotone" dataKey={`${name}_errorRate`} name={name} stroke={COLORS[idx % COLORS.length]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available to display in graph.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
