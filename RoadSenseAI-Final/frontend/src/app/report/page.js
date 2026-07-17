'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function ReportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [aiImage, setAiImage] = useState(null);
  const [form, setForm] = useState({ roadName: '', description: '', severity: 'medium' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      toast('Please log in to submit a report.');
      router.push('/login');
    }
  }, [user, router]);

  function detectLocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported on this device.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success('Location detected.');
      },
      () => {
        setLocating(false);
        toast.error('Could not detect location. Please enable GPS permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleFiles(e) {
    const files = Array.from(e.target.files).slice(0, 3);
    setImages(files);
    setPreviewUrls(files.map((f) => URL.createObjectURL(f)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!location) {
      toast.error('Please detect your GPS location first.');
      return;
    }
    setSubmitting(true);
    try {
  const fd = new FormData();
  fd.append('latitude', location.lat);
  fd.append('longitude', location.lng);
  fd.append('roadName', form.roadName);
  fd.append('description', form.description);
  fd.append('severity', form.severity);
  images.forEach((img) => fd.append('images', img));

  const { data } = await api.post('/reports', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  
  console.log(data); // Yeh check karne ke liye ki object me kya aa raha hai

  // 🔥 FIX: Check both data.image and data.report.images fallback
  if (data.image) {
    setAiImage( 'http://localhost:5000${data.image}');
  } else if (data.report?.images && data.report.images.length > 0) {
    // Agar report array ke andar images hain toh pehli image uthao
    setAiImage( 'http://localhost:5000${data.report.images[0].url}');
  } else {
    console.log("No image received");
  }
  toast.success(data.duplicate ? 'Confirmed an existing nearby report!' : 'Report submitted successfully!');
  //router.push('/map');
} catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-extrabold">Report a Pothole</h1>
      <p className="mt-1 text-sm text-slate-500">Help keep your roads safe — it only takes a minute.</p>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium">GPS Location</label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={detectLocation} className="btn-secondary text-sm">
              {locating ? 'Detecting...' : '📍 Detect My Location'}
            </button>
            {location && (
              <span className="text-xs text-success">
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Road Name (optional)</label>
          <input
            className="input"
            placeholder="e.g. MG Road, Sector 12"
            value={form.roadName}
            onChange={(e) => setForm({ ...form, roadName: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            className="input"
            rows={4}
            placeholder="Describe the road damage..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Severity</label>
          <select className="input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Photos (up to 3)</label>
          <input
            ref={fileInputRef}
            type="file" multiple
            accept="image/*"
            capture="environment"
      
            onChange={handleFiles}
            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
          />
          {previewUrls.length > 0 && (
            <div className="mt-3 flex gap-3">
              {previewUrls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt="preview" className="h-20 w-20 rounded-lg object-cover" />
              ))}
            </div>
          )}
          {aiImage && (
                <div className="mt-4">
                    <p className="mb-2 font-semibold">AI Detection Result</p>
                    <img 
                        src={aiImage} 
                        alt="AI Result" 
                        className="w-full rounded-lg border" 
                    />
                </div>
            )}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
