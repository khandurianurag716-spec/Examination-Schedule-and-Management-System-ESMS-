import { useState } from 'react';
import { LayoutDashboard, Users, BookOpen, Calendar, ClipboardEdit, RefreshCw } from 'lucide-react';
import { AuthUser } from '../../types/esms';
import { Layout, NavItem } from '../Layout';
import { FacultyDashboard } from './FacultyDashboard';
import { FacultyStudents } from './FacultyStudents';
import { FacultySubjects } from './FacultySubjects';
import { FacultySchedules } from './FacultySchedules';
import { FacultyMarks } from './FacultyMarks';
import { FacultyRevaluation } from './FacultyRevaluation';

interface FacultyPortalProps {
  user: AuthUser;
  onLogout: () => void;
}

const FACULTY_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'students', label: 'Assigned Students', icon: <Users className="w-4 h-4" /> },
  { id: 'subjects', label: 'Assigned Subjects', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'schedules', label: 'Exam Schedules', icon: <Calendar className="w-4 h-4" /> },
  { id: 'marks', label: 'Marks Entry', icon: <ClipboardEdit className="w-4 h-4" /> },
  { id: 'revaluation', label: 'Revaluation Reviews', icon: <RefreshCw className="w-4 h-4" /> },
];

export function FacultyPortal({ user, onLogout }: FacultyPortalProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <Layout
      user={user}
      navItems={FACULTY_NAV}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onLogout={onLogout}
    >
      {activeTab === 'dashboard' && <FacultyDashboard onNavigate={setActiveTab} />}
      {activeTab === 'students' && <FacultyStudents />}
      {activeTab === 'subjects' && <FacultySubjects />}
      {activeTab === 'schedules' && <FacultySchedules />}
      {activeTab === 'marks' && <FacultyMarks />}
      {activeTab === 'revaluation' && <FacultyRevaluation />}
    </Layout>
  );
}
