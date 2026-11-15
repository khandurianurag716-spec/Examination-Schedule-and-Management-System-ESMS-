import { useState } from 'react';
import { LayoutDashboard, UserCheck, BookOpen, Calendar, Award, RefreshCw } from 'lucide-react';
import { AuthUser } from '../../types/esms';
import { Layout, NavItem } from '../Layout';
import { StudentDashboard } from './StudentDashboard';
import { StudentProfile } from './StudentProfile';
import { StudentSubjects } from './StudentSubjects';
import { StudentSchedule } from './StudentSchedule';
import { StudentResults } from './StudentResults';
import { StudentRevaluation } from './StudentRevaluation';

interface StudentPortalProps {
  user: AuthUser;
  onLogout: () => void;
}

const STUDENT_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'profile', label: 'My Profile', icon: <UserCheck className="w-4 h-4" /> },
  { id: 'subjects', label: 'Subjects', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'schedule', label: 'Exam Schedule', icon: <Calendar className="w-4 h-4" /> },
  { id: 'results', label: 'Results & Marks', icon: <Award className="w-4 h-4" /> },
  { id: 'revaluation', label: 'Revaluation', icon: <RefreshCw className="w-4 h-4" /> },
];

export function StudentPortal({ user, onLogout }: StudentPortalProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [preselectedResultId, setPreselectedResultId] = useState<number | null>(null);

  function handleApplyRevaluation(resultId: number) {
    setPreselectedResultId(resultId);
    setActiveTab('revaluation');
  }

  return (
    <Layout
      user={user}
      navItems={STUDENT_NAV}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onLogout={onLogout}
    >
      {activeTab === 'dashboard' && <StudentDashboard onNavigate={setActiveTab} />}
      {activeTab === 'profile' && <StudentProfile />}
      {activeTab === 'subjects' && <StudentSubjects />}
      {activeTab === 'schedule' && <StudentSchedule />}
      {activeTab === 'results' && <StudentResults onRequestRevaluation={handleApplyRevaluation} />}
      {activeTab === 'revaluation' && <StudentRevaluation preselectedResultId={preselectedResultId} />}
    </Layout>
  );
}
