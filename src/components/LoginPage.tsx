import { FormEvent, useState } from 'react';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { apiRequest, setStoredToken } from '../services/api';
import { AuthUser, UserRole } from '../types/esms';
import { GehuLogo } from './ui/GehuLogo';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [role, setRole] = useState<UserRole>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const idLabel =
    role === 'student'
      ? 'Student Roll Number / Username'
      : role === 'faculty'
      ? 'Faculty ID / Username'
      : 'Admin Username';

  const idPlaceholder =
    role === 'student' ? 'e.g. GEHU2024001' : role === 'faculty' ? 'e.g. FAC101' : 'e.g. admin';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError('Please enter both your ID and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest<{ token: string; user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ role, identifier: identifier.trim(), password }),
      });

      setStoredToken(response.token);
      onLoginSuccess(response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:grid lg:grid-cols-12">
      {/* Left Institutional Showcase Panel */}
      <div className="relative lg:col-span-7 bg-slate-900 min-h-[260px] lg:min-h-screen flex flex-col justify-between overflow-hidden">
        {!imgError ? (
          <img
            src="/assets/aistudio/Grand_University_Campus_Under_Blue_Skies_9f1152f3.png"
            alt="Graphic Era Hill University Campus Building"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950"
            aria-hidden="true"
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/55"
          aria-hidden="true"
        />

        <div className="relative z-10 p-6 sm:p-10 flex items-center gap-3.5 text-white drop-shadow-sm">
          <GehuLogo size="md" className="shadow-sm" />
          <div>
            <p className="text-sm sm:text-base font-semibold tracking-tight">Graphic Era Hill University</p>
            <p className="text-xs text-slate-100">Dehradun · School of Computing</p>
          </div>
        </div>

        <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-2xl">
          <p className="text-xs font-medium text-blue-300 mb-3">
            Centralized Academic Examination Portal
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight text-balance">
            Examination Schedule and Management System
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-200 leading-relaxed max-w-xl">
            Unified university portal for examination timetables, marks evaluation, official result
            publication, and transparent student revaluation workflows.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
            <span>Student Portal</span>
            <span aria-hidden="true">·</span>
            <span>Faculty Grading</span>
            <span aria-hidden="true">·</span>
            <span>Controller Administration</span>
          </div>
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="lg:col-span-5 flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3.5">
            <GehuLogo size="md" className="border border-slate-200" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to GEHU-ESMS</h2>
              <p className="mt-0.5 text-sm text-slate-600">
                Graphic Era Hill University Examination Portal
              </p>
            </div>
          </div>

          {/* Role Segmented Selector */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-slate-600 mb-2">Account Role</label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              {(['student', 'faculty', 'admin'] as UserRole[]).map((r) => {
                const active = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setError(null);
                    }}
                    className={`py-2 px-3 text-sm font-medium rounded-md transition-colors capitalize whitespace-nowrap ${
                      active
                        ? 'bg-white text-blue-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-800"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-identifier" className="block text-sm font-medium text-slate-700 mb-1.5">
                {idLabel}
              </label>
              <div className="relative">
                <User
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={idPlaceholder}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-800 hover:bg-blue-900 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 whitespace-nowrap"
            >
              <span>{loading ? 'Signing in...' : `Sign in as ${role.charAt(0).toUpperCase() + role.slice(1)}`}</span>
              {!loading && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
            </button>
          </form>

          {/* Seeded Evaluation Reference Box */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-2">
              Seeded Evaluation Accounts (SQLite Demo)
            </p>
            <div className="text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Student Roll No.</span>
                <span className="font-mono text-slate-900">GEHU2024001</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Faculty Code</span>
                <span className="font-mono text-slate-900">FAC101</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Admin Username</span>
                <span className="font-mono text-slate-900">admin</span>
              </div>
              <p className="pt-1 text-slate-500">
                Initial demo password configured in database seed:{' '}
                <span className="font-mono text-slate-800">gehu@2026</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
