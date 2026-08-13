'use client';

import React from 'react';
import { ShieldCheck, Radio, AlertTriangle, Package, Activity, Cpu, Camera, LogOut, User as UserIcon, Globe, Type } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { usePreferences } from '@/lib/PreferencesContext';
import { useRouter } from 'next/navigation';

interface GovernmentHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isConnected: boolean;
  activeBreachesCount: number;
}

export const GovernmentHeader: React.FC<GovernmentHeaderProps> = ({
  activeTab,
  setActiveTab,
  isConnected,
  activeBreachesCount
}) => {
  const { user, logout } = useAuth();
  const { lang, setLang, fontSize, setFontSize, t } = usePreferences();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="w-full bg-govt-navy text-white shadow-md border-b-4 border-amber-500">
      {/* Top Ministry Banner - Fully Responsive Wrapping */}
      <div className="bg-govt-darknavy px-3 sm:px-4 py-2 text-xs flex flex-wrap justify-between items-center border-b border-slate-700 gap-2">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{t('portal_title')}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-slate-300">
          <span className="hidden sm:inline text-slate-400">{t('district')}</span>
          
          {/* Live WS Badge */}
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            <Radio className={`w-3 h-3 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-red-400'}`} />
            <span className="font-mono text-[10px] sm:text-[11px]">{isConnected ? t('live_ws') : t('offline')}</span>
          </div>

          {/* Accessibility Controls: Font Size (A- A A+) & Language (HI/EN) */}
          <div className="flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
            <button
              onClick={() => setFontSize('sm')}
              title="Small Text"
              className={`px-1 text-[11px] font-bold rounded ${fontSize === 'sm' ? 'bg-amber-500 text-slate-900' : 'text-slate-300 hover:text-white'}`}
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('md')}
              title="Normal Text"
              className={`px-1 text-[11px] font-bold rounded ${fontSize === 'md' ? 'bg-amber-500 text-slate-900' : 'text-slate-300 hover:text-white'}`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              title="Large Text"
              className={`px-1 text-[11px] font-bold rounded ${fontSize === 'lg' ? 'bg-amber-500 text-slate-900' : 'text-slate-300 hover:text-white'}`}
            >
              A+
            </button>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded border border-slate-700 text-[11px] font-semibold text-amber-300 transition-colors"
            title="Toggle Hindi / English"
          >
            <Globe className="w-3 h-3" />
            <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          {/* User Badge & Logout */}
          {user && (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700 max-w-full">
              <UserIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold text-white truncate max-w-[100px] sm:max-w-none">{user.name}</span>
              <span className="bg-amber-500/20 text-amber-300 font-mono text-[9px] sm:text-[10px] px-1 py-0.2 rounded uppercase shrink-0">
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="ml-1 text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 text-[11px] shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{t('logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Header Title */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            {t('system_title')}
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            {t('system_subtitle')}
          </p>
        </div>

        {activeBreachesCount > 0 && (
          <div className="bg-red-600/90 text-white px-3 py-1.5 rounded border border-red-400 text-xs font-semibold flex items-center gap-2 animate-bounce shrink-0">
            <AlertTriangle className="w-4 h-4" />
            <span>{activeBreachesCount} {t('active_breaches_warning')}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs - Horizontal Scroll on Mobile */}
      <nav className="px-4 sm:px-6 bg-slate-900/60 border-t border-slate-800 flex gap-1 overflow-x-auto whitespace-nowrap scrollbar-thin">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
            activeTab === 'overview'
              ? 'border-amber-400 text-amber-400 bg-slate-800/80'
              : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          {t('tab_overview')}
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
            activeTab === 'inventory'
              ? 'border-amber-400 text-amber-400 bg-slate-800/80'
              : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          {t('tab_inventory')}
        </button>

        <button
          onClick={() => setActiveTab('scanner')}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
            activeTab === 'scanner'
              ? 'border-amber-400 text-amber-400 bg-slate-800/80'
              : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          {t('tab_scanner')}
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
            activeTab === 'simulator'
              ? 'border-amber-400 text-amber-400 bg-slate-800/80'
              : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          {t('tab_simulator')}
        </button>
      </nav>
    </header>
  );
};
