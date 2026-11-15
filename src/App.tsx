import { useEffect, useState } from 'react';
import { apiRequest, clearStoredToken, getStoredToken } from './services/api';
import { AuthUser } from './types/esms';
import { LoginPage } from './components/LoginPage';
import { StudentPortal } from './components/student/StudentPortal';
import { FacultyPortal } from './components/faculty/FacultyPortal';
import { AdminPortal } from './components/admin/AdminPortal';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setCheckingSession(false);
      return;
    }

    apiRequest<{ user: AuthUser }>('/api/auth/me')
      .then((res) => setUser(res.user))
      .catch(() => {
        clearStoredToken();
        setUser(null);
      })
      .finally(() => setCheckingSession(false));
  }, []);

  async function handleLogout() {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // Clear local session regardless of network outcome
    } finally {
      clearStoredToken();
      setUser(null);
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-600">Loading GEHU Examination Portal...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={setUser} />;
  }

  if (user.role === 'student') {
    return <StudentPortal user={user} onLogout={handleLogout} />;
  }

  if (user.role === 'faculty') {
    return <FacultyPortal user={user} onLogout={handleLogout} />;
  }

  return <AdminPortal user={user} onLogout={handleLogout} />;
}
