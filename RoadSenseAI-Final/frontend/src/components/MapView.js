'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import api from '../lib/api';
import { io } from 'socket.io-client';

const STATUS_COLORS = {
  pending: '#f5a524',
  in_progress: '#1f9eff',
  fixed: '#17c964',
};

const ALERT_RADIUS_METERS = 300;

// दो लोकेशंस के बीच की दूरी मीटर में नापने का फ़ंक्शन
function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

// दो लोकेशंस के बीच बेयरिंग Angle (रोटेशन डिग्री) निकालने का फ़ंक्शन
function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// आवाज़ में अलर्ट बोलने के लिए फ़ंक्शन
function speak(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  window.speechSynthesis.speak(utter);
}

export default function MapView({ filters }) {
  const mapRef = useRef(null);
  const clusterRef = useRef(null);
  const containerRef = useRef(null);
  const warnedRef = useRef(new Set());
  const driverMarkerRef = useRef(null); 
  const lastCoordsRef = useRef(null);
  
  const [reports, setReports] = useState([]);
  const [alertsOn, setAlertsOn] = useState(false);
  const [driverPos, setDriverPos] = useState(null);
  const [nearestPothole, setNearestPothole] = useState(null);

  // --- यहाँ पर नया AI State बिना किसी पुराने फ़ीचर को डिस्टर्ब किए जोड़ा गया है ---
  const [aiStatus] = useState({
    model: "YOLOv8",
    status: "Active"
  });

  // 0. इजेक्टिंग CSS स्टाइल्स
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const styleId = 'map-view-custom-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = 
      '@keyframes pulse {\n' +
      '  0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(31, 158, 255, 0.7); }\n' +
      '  70% { transform: scale(1.1); box-shadow: 0 0 0 12px rgba(31, 158, 255, 0); }\n' +
      '  100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(31, 158, 255, 0); }\n' +
      '}\n' +
      '@keyframes blink {\n' +
      '  0% { opacity: 1; transform: scale(1); }\n' +
      '  50% { opacity: 0.4; transform: scale(1.3); filter: drop-shadow(0 0 8px red); }\n' +
      '  100% { opacity: 1; transform: scale(1); }\n' +
      '}\n' +
      '.blinking-pothole {\n' +
      '  animation: blink 0.8s infinite ease-in-out !important;\n' +
      '}\n' +
      '.car-icon-container {\n' +
      '  transition: transform 0.3s ease-in-out;\n' +
      '}';
    document.head.appendChild(style);
  }, []);

  // 1. Initial Map Setup
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current).setView([24.3162, 80.9729], 6); 
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {  
      attribution: '&copy; OpenStreetMap contributors',  
      maxZoom: 19,  
    }).addTo(map);  

    const cluster = L.markerClusterGroup();  
    map.addLayer(cluster);  

    mapRef.current = map;  
    clusterRef.current = cluster;  

    return () => {  
      if (mapRef.current) {  
        mapRef.current.remove();  
        mapRef.current = null;  
      }  
    };
  }, []);

  // 2. Load Existing Pothole Reports & Socket.IO
  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/reports/map');
        const fetchedReports = Array.isArray(data) ? data : (data?.reports || []);
        setReports(fetchedReports);
      } catch (err) {
        console.error("Error fetching map reports:", err);
      }
    }
    load();

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });  
    socket.on('report:new', (r) => setReports((prev) => [...prev, r]));  
    socket.on('report:updated', (r) => setReports((prev) => prev.map((x) => (x.id === r.id ? { ...x, ...r } : x))));  
    socket.on('report:deleted', ({ id }) => setReports((prev) => prev.filter((x) => x.id !== id)));  

    return () => socket.disconnect();
  }, []);

  // 3. Render Status Markers
  useEffect(() => {
    if (!clusterRef.current || !mapRef.current) return;
    clusterRef.current.clearLayers();

    const filtered = reports.filter((r) => {  
      if (filters?.status && r.status !== filters.status) return false;  
      if (filters?.severity && r.severity !== filters.severity) return false;  
      return true;  
    });  

    filtered.forEach((r) => {
      const color = STATUS_COLORS[r.status] || '#888';
      
      let distText = 'N/A';
      let isNear = false;
      if (driverPos) {
        const dist = distanceMeters(driverPos.lat, driverPos.lng, r.latitude, r.longitude);
        distText = Math.round(dist) + ' m';
        if (dist <= ALERT_RADIUS_METERS && r.status !== 'fixed') {
          isNear = true;
        }
      }

      const iconClassName = 'custom-pin' + (isNear ? ' blinking-pothole' : '');
      const iconHtml = '<div style="width:18px;height:18px;border-radius:50%;background:' + color + ';border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.4);"></div>';

      const iconOptions = L.divIcon({  
        className: iconClassName,  
        html: iconHtml,  
        iconSize: [18, 18],  
        iconAnchor: [9, 9]  
      });  

      const marker = L.marker([r.latitude, r.longitude], { icon: iconOptions });  

      const roadName = r.road_name || 'Unnamed Road';
      const severityColor = r.severity === 'high' ? '#ef4444' : (r.severity === 'medium' ? '#f5a524' : '#10b981');
      const formattedStatus = r.status.replace('_', ' ');
      const formattedDate = new Date(r.created_at).toLocaleString();
      const reportCount = r.report_count || 1;

      const popupContent = 
        '<div style="font-family:sans-serif;min-width:190px;color:#1e293b;line-height:1.5;">' +
        '    <div style="font-size:14px;font-weight:700;margin-bottom:4px;color:#0f172a;">📍 ' + roadName + '</div>' +
        '    <div style="height:1px;background:#e2e8f0;margin:6px 0;"></div>' +
        '    <b>Distance:</b> <span style="color:#ef4444;font-weight:700;">' + distText + '</span><br/>' +
        '    <b>Status:</b> <b style="color:' + color + ';text-transform:capitalize;">' + formattedStatus + '</b><br/>' +
        '    <b>Severity:</b> <span style="font-weight:600;color:' + severityColor + '">' + r.severity.toUpperCase() + '</span><br/>' +
        '    <b>Reports Counter:</b> ' + reportCount + '<br/>' +
        '    <small style="color:#64748b;">' + formattedDate + '</small>' +
        '</div>';

      marker.bindPopup(popupContent);  
      clusterRef.current.addLayer(marker);  
    });
  }, [reports, filters, driverPos]);

  // 4. Global Nominatim Search Trigger
  useEffect(() => {
    const activeSearch = (typeof filters === 'string' ? filters : filters?.search || '').toString().trim();

    if (!activeSearch || activeSearch.length < 3 || !mapRef.current) return;  

    const delayDebounce = setTimeout(async () => {  
      try {  
        const res = await fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(activeSearch + ', India') + '&limit=1');  
        const data = await res.json();  

        if (data && data.length > 0) {  
          const { lat, lon, display_name } = data[0];  
            
          mapRef.current.flyTo([parseFloat(lat), parseFloat(lon)], 14, {  
            animate: true,  
            duration: 1.8  
          });  

          const shortName = display_name.split(',').slice(0, 3).join(',');
          const searchPopupContent = 
            '<div style="font-family:sans-serif; font-size:12px; color:#1e293b; max-width:200px;">' +
            '  📍 <b>Searched Location:</b><br/> ' + shortName +
            '</div>';

          L.popup()  
            .setLatLng([parseFloat(lat), parseFloat(lon)])  
            .setContent(searchPopupContent)  
            .openOn(mapRef.current);  
        }  
      } catch (error) {  
        console.error("Geocoding failed:", error);  
      }  
    }, 800);  

    return () => clearTimeout(delayDebounce);
  }, [filters]);

  // 5. Live Driver Tracking, Rotation, Smooth FlyTo & Smart Panels
  useEffect(() => {
    if (!alertsOn || !navigator.geolocation || !mapRef.current) {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
        driverMarkerRef.current = null;
      }
      setDriverPos(null);
      setNearestPothole(null);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(  
      (pos) => {  
        const { latitude, longitude } = pos.coords;  
        setDriverPos({ lat: latitude, lng: longitude });

        let angle = 0;
        if (lastCoordsRef.current) {
          angle = calculateBearing(
            lastCoordsRef.current.lat, 
            lastCoordsRef.current.lng, 
            latitude, 
            longitude
          );
          if (angle === 0 && lastCoordsRef.current.angle) {
            angle = lastCoordsRef.current.angle;
          }
        }
        lastCoordsRef.current = { lat: latitude, lng: longitude, angle: angle };

        const carHtml = '<div class="car-icon-container" style="transform: rotate(' + angle + 'deg); font-size: 26px; line-height: 1; text-align: center; animation: pulse 1.8s infinite; display: inline-block;">🚗</div>';

        const driverIcon = L.divIcon({
          className: 'driver-live-marker',
          html: carHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        if (driverMarkerRef.current) {
          driverMarkerRef.current.setLatLng([latitude, longitude]);
          driverMarkerRef.current.setIcon(driverIcon);
        } else {
          driverMarkerRef.current = L.marker([latitude, longitude], { icon: driverIcon }).addTo(mapRef.current);
          driverMarkerRef.current.bindPopup("<b>Live Delivery / Driver Agent</b>").openPopup();
        }

        mapRef.current.flyTo([latitude, longitude], mapRef.current.getZoom(), {
          duration: 1,
          animate: true
        });

        let closest = null;
        let minDistance = Infinity;

        reports.forEach((r) => {  
          if (r.status === 'fixed') return;  
          const d = distanceMeters(latitude, longitude, r.latitude, r.longitude);  
          
          if (d < minDistance) {
            minDistance = d;
            closest = { ...r, distance: Math.round(d) };
          }

          if (d <= ALERT_RADIUS_METERS && !warnedRef.current.has(r.id)) {  
            warnedRef.current.add(r.id);  
            const alertText = 'Warning, pothole ahead on ' + (r.road_name || 'this road');
            speak(alertText);  
            setTimeout(() => warnedRef.current.delete(r.id), 1000 * 60 * 5);  
          }  
        });  

        if (closest) {
          setNearestPothole(closest);
        }
      },  
      (err) => console.error("GPS Tracking Error:", err),  
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );  

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
        driverMarkerRef.current = null;
      }
    };
  }, [alertsOn, reports]);

  return (
    <div className="relative h-full w-full" style={{ minHeight: '600px' }}>
      
      {/* 🤖 AI Detection Card - यहाँ बिल्कुल सटीक स्पेसिंग (top-[180px]) के साथ जोड़ा गया है ताकि पुराने कार्ड से न टकराए */}
      <div
        className="absolute left-4 top-[180px] z-[1000] max-w-xs w-72 rounded-2xl bg-white/95 backdrop-blur-md p-4 shadow-xl border border-slate-100 transition-all duration-300"
      >
        <h3 className="font-bold text-slate-800 flex items-center gap-1 text-sm">
          🤖 AI Detection System
        </h3>
        <div className="h-[1px] bg-slate-100 my-2"></div>
        <p className="text-sm text-green-600 font-semibold">
          ✔️ AI Model : <span className="text-slate-700 font-medium">{aiStatus.model}</span>
        </p>
        <p className="text-sm text-blue-600 font-semibold mt-0.5">
          Status : <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold uppercase">{aiStatus.status}</span>
        </p>
        <p className="text-[11px] text-slate-500 mt-2 border-t pt-1.5 border-slate-100 leading-relaxed">
          Every uploaded image is verified using YOLO AI before saving to database.
        </p>
      </div>

      {alertsOn && nearestPothole && (
        <div className="absolute left-4 top-4 z-[1000] max-w-xs w-72 rounded-2xl bg-white/95 backdrop-blur-md p-4 shadow-xl border border-slate-100 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">⚠️ Nearest Hazard</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              nearestPothole.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {nearestPothole.severity}
            </span>
          </div>
          <div className="text-base font-bold text-slate-800 truncate">
            {nearestPothole.road_name || 'Unknown Road'}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-red-500">{nearestPothole.distance}</span>
            <span className="text-xs font-semibold text-slate-500">meters away</span>
          </div>
        </div>
      )}

      <div ref={containerRef} className="h-full w-full" style={{ minHeight: '600px', zIndex: 1 }} />
      
      <button
        onClick={() => setAlertsOn((v) => !v)}
        className={`absolute right-4 top-4 z-[1000] rounded-xl px-4 py-2 text-sm font-semibold shadow-lg transition-all ${
          alertsOn ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-white text-slate-700 hover:bg-slate-50'
        }`}
      >
        {alertsOn ? '🔊 Driver Alerts: ON' : '🔇 Driver Alerts: OFF'}
      </button>
    </div>
  );
}