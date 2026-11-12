import React, { useState, useEffect } from 'react';
import { GlassCard } from '../layout/GlassCard';
import { Lock, Mail, ShieldAlert, Sparkles, X, Loader2, CheckCircle2 } from 'lucide-react';
import { User, AuthResponse } from '../../types/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User, token: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const demoPassword = import.meta.env.VITE_DEMO_PASSWORD || '';

  const handleQuickFillStaff = () => {
    setEmail('staff@singslot.local');
    setPassword(demoPassword);
    setErrorMessage(null);
  };

  const handleQuickFillCustomer = () => {
    setEmail('customer1@singslot.local');
    setPassword(demoPassword);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data: AuthResponse = await response.json();

      if (!response.ok || !data.success || !data.token || !data.user) {
        setErrorMessage(
          data.error?.message || 'Authentication failed. Please check your credentials.'
        );
        return;
      }

      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Unable to connect to SingSlot authentication service.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard className="relative border-pink-200/90 bg-white/95 shadow-2xl shadow-purple-200/50">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-pink-300 via-purple-300 to-sky-300 shadow-md shadow-purple-200/50 border border-pink-200/60 mb-3">
              <Lock className="h-6 w-6 text-purple-950" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Sign In to SingSlot
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Access online room reservations and schedule management
            </p>
          </div>

          {/* Quick-Fill Demo Buttons (Only rendered in development mode per Episode 2.2) */}
          {import.meta.env.DEV && (
            <div className="mb-6 rounded-xl border border-purple-200 bg-purple-50/60 p-3.5 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold uppercase tracking-wider text-purple-700">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                <span>Sprint 1 Seeded Demo Accounts</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleQuickFillStaff}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-purple-200 bg-white px-2.5 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 hover:border-purple-300 shadow-xs transition-all"
                  title="Fill Staff credentials (staff@singslot.local)"
                >
                  <span>Staff Demo</span>
                  <span className="text-[10px] text-purple-500 font-mono">(Cashier)</span>
                </button>
                <button
                  type="button"
                  onClick={handleQuickFillCustomer}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-pink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-pink-700 hover:bg-pink-100 hover:border-pink-300 shadow-xs transition-all"
                  title="Fill Customer credentials (customer1@singslot.local)"
                >
                  <span>Customer Demo</span>
                  <span className="text-[10px] text-pink-500 font-mono">(Alice)</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 shadow-sm">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@singslot.local"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-colors shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-colors shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-300 via-purple-300 to-sky-300 px-4 py-2.5 text-sm font-extrabold text-purple-950 shadow-sm shadow-purple-100 hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-pink-200/50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};
