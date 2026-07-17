'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_BADGE = {
  pending: 'bg-warning/10 text-warning',
  in_progress: 'bg-brand-100 text-brand-700',
  fixed: 'bg-success/10 text-success',
  rejected: 'bg-danger/10 text-danger',
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.get('/reports', { params: { limit: 50 } }).then(({ data }) => {
      setReports(data.reports.filter((r) => r.user_id === user.id));
      setFetching(false);
    });
  }, [user]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-extrabold">My Reports</h1>
      <p className="mt-1 text-sm text-slate-500">Track the status of your submitted pothole reports.</p>

      <div className="mt-6 space-y-3">
        {fetching && <p className="text-sm text-slate-400">Loading...</p>}
        {!fetching && reports.length === 0 && (
          <div className="card text-center text-sm text-slate-500">You haven't submitted any reports yet.</div>
        )}
        {reports.map((r) => (
          <div key={r.id} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold">{r.road_name || 'Unnamed Road'}</p>
              <p className="text-xs text-slate-400">{new Date(r.created_at).toLocaleString()}</p>
            </div>
            <span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
