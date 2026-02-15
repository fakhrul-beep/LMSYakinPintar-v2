import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { Wifi, AlertTriangle, ShieldCheck } from 'lucide-react';

const NetworkMonitor = () => {
  useEffect(() => {
    const handlePersistentError = () => {
      toast((t) => (
        <div className="flex flex-col gap-3 p-1">
          <div className="flex items-start gap-3">
            <div className="bg-amber-100 p-2 rounded-full text-amber-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Terdeteksi gangguan koneksi berulang.</p>
              <p className="text-slate-600 text-xs mt-1">
                Silakan periksa pengaturan firewall atau VPN Anda untuk memastikan koneksi tidak diblokir. 
                Jika masalah berlanjut, hubungi tim support.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-1">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                runDiagnostics();
              }}
              className="bg-primary text-white text-xs px-3 py-1.5 rounded-md font-semibold hover:bg-accent transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck size={14} />
              Cek Koneksi
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-slate-500 text-xs px-3 py-1.5 hover:bg-slate-100 rounded-md transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      ), {
        duration: 10000,
        id: 'persistent-connection-alert',
        style: {
          maxWidth: '400px',
          padding: '12px',
          borderRadius: '12px',
        }
      });
    };

    const runDiagnostics = async () => {
      const diagToast = toast.loading('Menjalankan diagnosa jaringan...', { id: 'network-diag' });
      
      try {
        const results = {
          online: navigator.onLine,
          latency: 'Testing...',
          api: 'Testing...'
        };

        // 1. Check navigator
        if (!results.online) {
          toast.error('Browser melaporkan status Offline. Periksa kabel LAN atau WiFi Anda.', { id: 'network-diag' });
          return;
        }

        // 2. Latency check (Google pixel)
        const start = Date.now();
        await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' });
        results.latency = `${Date.now() - start}ms`;

        // 3. API Reachability
        const apiStart = Date.now();
        try {
          const apiBase = import.meta.env.VITE_API_URL || '/api';
          const apiRes = await fetch(`${apiBase}/health`);
          if (apiRes.ok) {
            results.api = 'Terhubung';
          } else {
            results.api = `Error ${apiRes.status}`;
          }
        } catch (e) {
          results.api = 'Terblokir/Timeout';
        }

        toast.success(
          <div className="text-xs">
            <p className="font-bold mb-1">Hasil Diagnosa:</p>
            <p>• Internet: OK ({results.latency})</p>
            <p>• Server API: {results.api}</p>
            {results.api !== 'Terhubung' && (
              <p className="text-red-600 mt-1 font-semibold">Kemungkinan diblokir Firewall/VPN!</p>
            )}
          </div>,
          { id: 'network-diag', duration: 5000 }
        );
      } catch (err) {
        toast.error('Gagal menjalankan diagnosa lengkap.', { id: 'network-diag' });
      }
    };

    window.addEventListener('persistent-connection-error', handlePersistentError);
    return () => window.removeEventListener('persistent-connection-error', handlePersistentError);
  }, []);

  return null;
};

export default NetworkMonitor;
