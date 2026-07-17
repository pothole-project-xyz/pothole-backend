'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const MapView = dynamic(() => import('../../components/MapView'), { 
  ssr: false,
  loading: () => <div style={{ height: "100%", width: "100%" }}>Loading Map...</div>
});
export default function MapPage() {
  const [filters, setFilters] = useState({ status: '', severity: '', search: '' });

  return (
    <div className="flex h-[calc(100vh-72px)] flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
        <input
          placeholder="Search road name..."
          className="input max-w-xs"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select className="input max-w-[160px]" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="fixed">Fixed</option>
        </select>
        <select className="input max-w-[160px]" value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })}>
          <option value="">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <div className="ml-auto flex gap-4 text-xs text-slate-500">
          <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-warning" />Pending</span>
          <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-brand-500" />In Progress</span>
          <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-success" />Fixed</span>
        </div>
      </div>
      <div className="flex-1">
        <MapView filters={filters} />
      </div>
    </div>
  );
}
