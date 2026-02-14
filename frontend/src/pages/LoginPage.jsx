import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { LogIn, AlertCircle, WifiOff, Loader2 } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const LoginPage = () => {
  const { login } = useAuth();
  const isOnline = useNetworkStatus();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isOnline) {
      setError('Koneksi internet terputus. Silakan cek koneksi Anda.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      console.error("Login unexpected error:", err);
      setError("Terjadi kesalahan sistem internal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-100">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LogIn size={24} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            Masuk ke Akun
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Untuk Murid dan Guru YakinPintar
          </p>
        </div>

        {!isOnline && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs font-medium text-amber-800 ring-1 ring-amber-100">
            <WifiOff size={14} />
            <span>Mode Offline: Anda tidak bisa masuk sementara waktu.</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Alamat Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Kata Sandi
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 ring-1 ring-red-100">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !isOnline}
              className="group relative flex w-full justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-md shadow-primary/20 hover:bg-accent hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Masuk Sekarang"
              )}
            </button>
          </div>
        </form>
        <div className="text-center text-sm">
          <Link to="/" className="font-medium text-primary hover:text-accent transition-colors">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
