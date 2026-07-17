'use client';

import Link from 'next/link';

const FEATURES = [
  { icon: '📍', title: 'Live GPS Reporting', desc: 'Report potholes in seconds with auto-detected location and road name.' },
  { icon: '🤖', title: 'AI Pothole Detection', desc: 'Deep learning model verifies images and estimates severity automatically.' },
  { icon: '🗺️', title: 'Real-Time Live Map', desc: 'City-wide map with clustering, filters, and status-coded markers.' },
  { icon: '🔊', title: 'Smart Driver Alerts', desc: 'Voice warnings as you approach reported hazards on your route.' },
  { icon: '📊', title: 'Admin Analytics', desc: 'Heatmaps, severity charts, and repair tracking for municipal teams.' },
  { icon: '🔐', title: 'Enterprise-Grade Security', desc: 'JWT auth, rate limiting, input sanitization, and encrypted storage.' },
];

const STATS = [
  { value: '12,400+', label: 'Potholes Reported' },
  { value: '8,950+', label: 'Roads Fixed' },
  { value: '46', label: 'Cities Onboarded' },
  { value: '98.2%', label: 'AI Detection Accuracy' },
];

const TESTIMONIALS = [
  { name: 'Maria Chen', role: 'City Public Works Director', quote: 'Repair response time dropped by 40% within the first quarter of using SmartRoad.' },
  { name: 'Daniel Osei', role: 'Daily Commuter', quote: 'I report a pothole on my way to work and it shows up on the live map instantly.' },
  { name: 'Priya Nair', role: 'Smart City Program Lead', quote: 'The AI detection cuts down fake and duplicate reports dramatically.' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      
      {/* 1. EMERGENCY ROAD SAFETY BANNER */}
      <div className="bg-gradient-to-r from-amber-500 via-red-600 to-amber-500 text-white font-medium text-xs md:text-sm py-2.5 px-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-2 animate-pulse z-10">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <span className="text-base md:text-lg">⚠️</span>
          <div>
            <span className="font-bold tracking-wide uppercase">Emergency Alert:</span>{' '}
            High density of deep potholes detected on regional routes. Drive safe and keep 'Driver Alerts' turned ON.
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-white/30 backdrop-blur-sm hidden sm:inline-block">
            Live Syncing
          </span>
          <span className="h-2 w-2 rounded-full bg-green-400 border border-white animate-ping"></span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          
          {/* Hero Left Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <span className="inline-block bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 px-3 py-1 rounded-full text-xs font-semibold">
              AI-Powered Smart City Platform
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
              Detect. Report. <span className="text-brand-600">Fix Roads</span> Faster.
            </h1>
            <p className="mt-6 max-w-xl mx-auto lg:mx-0 text-base md:text-lg text-slate-600 dark:text-slate-300">
              Smart Road Monitoring uses live GPS, AI image detection, and real-time mapping
              to help citizens and municipal authorities identify and repair road damage faster.
            </p>
            
            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row justify-center lg:justify-start gap-4 px-4 sm:px-0">
              <Link href="/report" className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-semibold text-center px-6 py-3 rounded-xl shadow-md active:scale-95 transition-all">
                🚨 Report a Pothole
              </Link>
              <Link href="/map" className="w-full sm:w-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-center px-6 py-3 rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all">
                🗺️ View Live Map
              </Link>
            </div>
            
            <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-4 md:gap-6 text-xs md:text-sm text-slate-500 dark:text-slate-400">
              <span>✔️ Free for citizens</span>
              <span>✔️ Real-time updates</span>
              <span>✔️ Municipal-ready</span>
            </div>
          </div>

          {/* Hero Right Content - Live Status Feed */}
          <div className="relative order-1 lg:order-2 px-2 sm:px-0">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Live Status Feed</span>
                <span className="text-xs font-semibold text-success flex items-center gap-1.5 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-success"></span> Live Updates
                </span>
              </div>
              <div className="space-y-3 p-4 md:p-5">
                {[
                  { road: 'MG Road, Sector 12', status: 'Pending', color: 'bg-warning/10 text-warning border border-warning/20' },
                  { road: 'Lake View Avenue', status: 'In Progress', color: 'bg-brand-100 text-brand-700 border border-brand-200' },
                  { road: 'Riverside Drive', status: 'Fixed', color: 'bg-success/10 text-success border border-success/20' },
                ].map((item) => (
                  <div key={item.road} className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-800">
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.road}</p>
                      <p className="text-xs text-slate-400">Reported 2 hours ago</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${item.color}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-slate-100 bg-white py-12 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 gap-x-4 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl md:text-3xl font-extrabold text-brand-600">{s.value}</p>
              <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 dark:text-white">Everything a Smart City Needs</h2>
          <p className="mt-4 text-sm md:text-base text-slate-600 dark:text-slate-300">
            A complete platform connecting citizens, drivers, and municipal authorities in one real-time system.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-2xl dark:bg-brand-900/30">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-slate-50 py-24 dark:bg-slate-900">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 dark:text-white">Built for Real Cities, Real Roads</h2>
            <p className="mt-5 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              SmartRoad bridges the gap between citizens and municipal authorities. Every report is verified
              with AI, geotagged precisely, and routed into a live operations dashboard so repair crews can
              prioritize the most severe and frequently reported damage first.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300 inline-block lg:block text-left">
              <li className="flex items-center gap-2">✔️ Duplicate-aware reporting reduces noise</li>
              <li className="flex items-center gap-2">✔️ Severity scoring helps prioritize repairs</li>
              <li className="flex items-center gap-2">✔️ Transparent public status tracking</li>
            </ul>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Who It's For</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Drivers', 'Municipal Authorities', 'Smart City Departments', 'Public Citizens'].map((r) => (
                <div key={r} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 text-sm font-semibold text-slate-700 dark:text-slate-300 text-center border border-slate-100/50 dark:border-slate-800">
                  {r}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 dark:text-white">Trusted by Cities & Commuters</h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
              <p className="text-sm italic text-slate-600 dark:text-slate-300 leading-relaxed">"{t.quote}"</p>
              <div className="mt-5 border-t border-slate-50 dark:border-slate-800 pt-3">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t.name}</p>
                <p className="text-xs text-slate-400 font-medium">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-600">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white sm:text-4xl">Ready to make your city's roads safer?</h2>
          <p className="mt-4 text-sm md:text-base text-brand-100">Join thousands of citizens already reporting road damage in real time.</p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 px-6 sm:px-0">
            <Link href="/register" className="w-full sm:w-auto rounded-xl bg-white px-6 py-3 font-semibold text-brand-700 transition hover:bg-brand-50 text-center shadow-md active:scale-95">
              Create Free Account
            </Link>
            <Link href="/map" className="w-full sm:w-auto rounded-xl border border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10 text-center active:scale-95">
              Explore Live Map
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}