import { useState } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  Award,
  RefreshCw,
  FileBarChart2,
} from 'lucide-react';
import { AuthUser } from '../../types/esms';
import { Layout, NavItem } from '../Layout';
import { AdminDashboard } from './AdminDashboard';
import { AdminStudents } from './AdminStudents';
import { AdminFaculty } from './AdminFaculty';
import { AdminSubjects } from './AdminSubjects';
import { AdminSchedules } from './AdminSchedules';
import { AdminResults } from './AdminResults';
import { AdminRevaluation } from './AdminRevaluation';
import { AdminReports } from './AdminReports';

interface AdminPortalProps {
  user: AuthUser;
  onLogout: () => void;
}

const ADMIN_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'students', label: 'Students', icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'faculty', label: 'Faculty', icon: <Users className="w-4 h-4" /> },
  { id: 'subjects', label: 'Subjects', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'schedules', label: 'Exam Schedules', icon: <Calendar className="w-4 h-4" /> },
  { id: 'results', label: 'Marks & Results', icon: <Award className="w-4 h-4" /> },
  { id: 'revaluation', label: 'Revaluation', icon: <RefreshCw className="w-4 h-4" /> },
  { id: 'reports', label: 'Reports', icon: <FileBarChart2 className="w-4 h-4" /> },
];

export function AdminPortal({ user, onLogout }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <Layout
      user={user}
      navItems={ADMIN_NAV}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onLogout={onLogout}
    >
      {activeTab === 'dashboard' && <AdminDashboard onNavigate={setActiveTab} />}
      {activeTab === 'students' && <AdminStudents />}
      {activeTab === 'faculty' && <AdminFaculty />}
      {activeTab === 'subjects' && <AdminSubjects />}
      {activeTab === 'schedules' && <AdminSchedules />}
      {activeTab === 'results' && <AdminResults />}
      {activeTab === 'revaluation' && <AdminRevaluation />}
      {activeTab === 'reports' && <AdminReports />}
    </Layout>
  );
}
