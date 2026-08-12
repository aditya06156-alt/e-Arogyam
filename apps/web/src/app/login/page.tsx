'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, Building2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.facilityIds && user.facilityIds.length > 0) {
        router.push(`/hospital/${user.facilityIds[0]}`);
      } else {
        router.push('/admin');
      }
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message || 'Login failed. Please check credentials.');
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Verifying Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      {/* Top Banner */}
      <header className="bg-slate-900 border-b border-slate-800 py-3 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>e-AROGYAM • GORAKHPUR DISTRICT HEALTH INTELLIGENCE PORTAL</span>
        </div>
        <span className="text-[11px] text-slate-400">Secure Access Gateway</span>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden">
          {/* Card Header */}
          <div className="bg-slate-900 p-6 border-b border-slate-800 text-center">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">e-Arogyam Portal Login</h1>
            <p className="text-xs text-slate-400 mt-1">
              Pharmaceutical Cold-Chain & Inventory Monitoring System
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-5">
            {error && (
              <div className="bg-red-950/80 border border-red-800 text-red-200 text-xs p-3 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Official Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@earogyam.health"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 px-4 rounded text-xs transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Login Credentials Selector */}
            <div className="pt-4 border-t border-slate-800">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Quick Demo Accounts (Click to Autofill):
              </span>
              <div className="space-y-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@earogyam.health', 'admin123')}
                  className="w-full text-left p-2.5 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded flex justify-between items-center transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-bold text-slate-200 text-xs">Chief District Admin</div>
                      <div className="text-[10px] text-slate-400">admin@earogyam.health</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">All Hospitals</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('brd@earogyam.health', 'brd123')}
                  className="w-full text-left p-2.5 bg-slate-950 border border-slate-800 hover:border-blue-500/50 rounded flex justify-between items-center transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="font-bold text-slate-200 text-xs">BRD Medical College Officer</div>
                      <div className="text-[10px] text-slate-400">brd@earogyam.health</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded">BRD Hospital</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('aiims@earogyam.health', 'aiims123')}
                  className="w-full text-left p-2.5 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded flex justify-between items-center transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-bold text-slate-200 text-xs">AIIMS Gorakhpur Officer</div>
                      <div className="text-[10px] text-slate-400">aiims@earogyam.health</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded">AIIMS</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('nscb@earogyam.health', 'nscb123')}
                  className="w-full text-left p-2.5 bg-slate-950 border border-slate-800 hover:border-purple-500/50 rounded flex justify-between items-center transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="font-bold text-slate-200 text-xs">NSCB District Hospital Officer</div>
                      <div className="text-[10px] text-slate-400">nscb@earogyam.health</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded">NSCB Hospital</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3 text-center text-xs text-slate-500">
        e-Arogyam District Healthcare Logistics Portal • Gorakhpur Region
      </footer>
    </div>
  );
}
