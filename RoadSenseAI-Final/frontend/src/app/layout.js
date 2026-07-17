import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Smart Road Monitoring System | AI Pothole Detection & Reporting',
  description:
    'Report potholes in real time with GPS and AI image detection. Live city-wide maps, smart driver alerts, and a municipal admin dashboard for faster road repairs.',
  keywords: ['pothole detection', 'smart city', 'road monitoring', 'municipal dashboard'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Toaster position="top-right" />
          <Navbar />
          <main className="min-h-screen pt-[72px]">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
