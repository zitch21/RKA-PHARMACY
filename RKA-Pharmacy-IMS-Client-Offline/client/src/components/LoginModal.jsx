import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/* R.K.A. Pharmacy Clinical Cross Logo Token */
function PharmacyCrossLogo({ className = "w-7 h-7 shrink-0" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8.5" y="2.5" width="7" height="19" rx="3.5" fill="#10b981" />
      <rect x="2.5" y="8.5" width="19" height="7" rx="3.5" fill="#10b981" />
      <path d="M6 12H9.5L10.8 9.2L13.2 14.8L14.5 12H18" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LoginModal({ onLogin }) {
  const { t } = useLanguage();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      sessionStorage.setItem('rka_auth_token', data.token);
      sessionStorage.setItem('rka_user', JSON.stringify(data.user));

      if (onLogin) {
        onLogin(data.user, data.token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#181d26] rounded-[32px] shadow-[0_25px_70px_rgba(0,0,0,0.15)] max-w-sm w-full overflow-hidden border border-slate-200/90 dark:border-white/10 p-6 sm:p-7">
        {/* R.K.A. Pharmacy Brand Header */}
        <div className="text-center">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center mx-auto mb-3 shadow-md border border-emerald-400/20">
            <PharmacyCrossLogo className="w-7 h-7 text-white shrink-0" />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            R.K.A. PHARMACY
          </h1>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              FEFO+ Engine • Clinic IMS
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            San Antonio, Agoo, La Union
          </p>
        </div>

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 text-xs">
          <div className="flex items-center gap-2 pt-2 pb-1 border-t border-slate-100 dark:border-white/10">
            <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {t('login_operator_auth', 'Operator Authentication')}
            </h2>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              {t('login_username', 'Operator Username')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('login_username_placeholder', 'Username')}
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/70 dark:bg-[#1e2430] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#1e2430] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              {t('login_password', 'Station Password')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login_password_placeholder', 'Enter password')}
                className="w-full pl-9 pr-9 py-2.5 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/70 dark:bg-[#1e2430] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#1e2430] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none transition tabular-nums"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-1.5 block tabular-nums">
              {t('login_default_password', 'Default password:')} <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold">rka2026</code>
            </span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('login_access_btn', 'Access Clinic Workstation')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          <div className="pt-3 text-center text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-white/10 tabular-nums">
            {t('login_protected_by', 'Protected by offline scrypt password hashing.')}
          </div>
        </form>
      </div>
    </div>
  );
}

