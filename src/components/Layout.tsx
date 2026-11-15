import { ReactNode, useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { AuthUser } from '../types/esms';
import { GehuLogo } from './ui/GehuLogo';

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

interface LayoutProps {
  user: AuthUser;
  navItems: NavItem[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onLogout: () => void;
  children: ReactNode;
}

export function Layout({ user, navItems, activeTab, onSelectTab, onLogout, children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeNav = navItems.find((item) => item.id === activeTab);
  const roleLabel =
    user.role === 'admin' ? 'Examination Controller' : user.role === 'faculty' ? 'Faculty' : 'Student';
  const roleCode = user.roll_number || user.faculty_code || user.username;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation (260px fixed width on desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 print:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <GehuLogo size="sm" />
            <div className="min-w-0">
              <span className="block font-semibold text-sm tracking-tight text-slate-900 whitespace-nowrap truncate">
                GEHU-ESMS
              </span>
              <span className="block text-[11px] text-slate-500 whitespace-nowrap truncate">
                Examination Portal
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-md"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Portal Navigation">
          {navItems.map((item) => {
            const isActive = item.id === activeTab;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50 text-blue-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className={`shrink-0 ${isActive ? 'text-blue-700' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="mb-3 px-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{user.full_name}</p>
            <p className="text-xs text-slate-500 truncate tabular-nums">
              {roleLabel} · {roleCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb trail left, user context & logout right */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-8 shrink-0 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <GehuLogo size="sm" className="lg:hidden" />
            <div className="flex items-center gap-2 text-sm min-w-0 truncate">
              <span className="text-slate-500 hidden sm:inline whitespace-nowrap">
                Graphic Era Hill University
              </span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="text-slate-500 whitespace-nowrap">{roleLabel}</span>
              <span className="text-slate-300" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-slate-900 truncate">
                {activeNav?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap">
              <span className="font-medium text-slate-700">{user.full_name}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{roleCode}</span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
