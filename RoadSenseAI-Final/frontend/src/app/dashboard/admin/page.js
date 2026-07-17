'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import api from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

const COLORS = ['#17c964', '#1f9eff', '#f5a524', '#ef4444'];

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'authority'))) {
      router.push('/login');
    }
  }, [user, loading, router]);

  async function loadData() {
    const [statsRes, reportsRes] = await Promise.all([
      api.get('/reports/stats'),
      api.get('/reports', { params: { limit: 50, status: filterStatus || undefined } }),
    ]);
    setStats(statsRes.data);
    setReports(reportsRes.data.reports);
  }

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'authority')) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filterStatus]);

  async function updateStatus(id, status) {
    try {
      await api.patch(`/reports/${id}/status`, { status });
      toast.success('Status updated.');
      loadData();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  }

  async function deleteReport(id) {
    if (!confirm('Delete this report permanently? This cannot be undone.')) return;
    try {
      await api.delete(`/reports/${id}`);
      toast.success('Report deleted.');
      loadData();
    } catch (err) {
      toast.error('Failed to delete report.');
    }
  }

  if (!user || !stats) return <div className="px-4 py-12 text-center text-sm text-slate-400">Loading dashboard...</div>;

  const totals = stats.totals;
  const pieData = [
    { name: 'Fixed', value: Number(totals.fixed) },
    { name: 'In Progress', value: Number(totals.in_progress) },
    { name: 'Pending', value: Number(totals.pending) },
    { name: 'Rejected', value: Number(totals.rejected) },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-2xl font-extrabold">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Monitor and manage road damage reports city-wide.</p>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          ['Total', totals.total],
          ['Pending', totals.pending],
          ['In Progress', totals.in_progress],
          ['Fixed', totals.fixed],
          ['Rejected', totals.rejected],
        ].map(([label, value]) => (
          <div key={label} className="card text-center">
            <p className="text-2xl font-extrabold text-brand-600">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-sm font-bold">Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-bold">Reports by Severity</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.bySeverity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="severity" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#1f9eff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="mb-4 text-sm font-bold">Reports Trend (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1f9eff" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reports table */}
      <div className="mt-8 card overflow-x-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold">Recent Reports</h3>
          <select className="input max-w-[160px]" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="fixed">Fixed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
              <th className="py-2">Image</th>
              <th className="py-2">Road</th>

              <th>Severity</th>
              <th>Status</th>
              <th>Reports</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800/50">
                
                <td className="py-3">
  {r.images && r.images.length > 0 ? (
    <img
  src={"http://localhost:5000" + r.images[0].url}
  alt="Pothole"
  className="h-[70px] w-[100px] rounded-lg border border-slate-300 object-cover"
/>
  ) : (
    <span className="text-xs text-slate-400">No Image</span>
  )}
</td>
                <td className="py-3">{r.road_name || 'Unnamed Road'}</td>
                <td className="capitalize">{r.severity}</td>
                <td>
                  <select
                    value={r.status}
                    onChange={(e) => updateStatus(r.id, e.target.value)}
                    className="rounded-lg border border-slate-200 bg-transparent px-2 py-1 text-xs dark:border-slate-700"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="fixed">Fixed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
                <td>{r.report_count}</td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => deleteReport(r.id)} className="text-xs font-semibold text-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
