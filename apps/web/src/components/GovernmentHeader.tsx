'use client';

import { ShieldCheck, Radio, AlertTriangle, Package, Activity, Cpu, Camera, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
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
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="w-full bg-govt-navy text-white shadow-md border-b-4 border-amber-500">
      {/* Top Ministry Banner */}
      <div className="bg-govt-darknavy px-4 py-1.5 text-xs flex flex-wrap justify-between items-center border-b border-slate-700 gap-2">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>e-AROGYAM • INTEGRATED HEALTH INTELLIGENCE SYSTEM</span>
        </div>
        <div className="flex items-center gap-4 text-slate-300">
          <span>Gorakhpur District Portal</span>
          <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            <Radio className={`w-3 h-3 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-red-400'}`} />
            <span className="font-mono text-[11px]">{isConnected ? 'LIVE WS CONNECTED' : 'OFFLINE'}</span>
          </div>

          {user && (
            <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700">
              <UserIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-white">{user.name}</span>
              <span className="bg-amber-500/20 text-amber-300 font-mono text-[10px] px-1.5 py-0.2 rounded uppercase">
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="ml-1 text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 text-[11px]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Header Title */}
      <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            e-Arogyam — Pharmaceutical Cold-Chain & Inventory Management System
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Real-time cold-chain monitoring, batch traceability, and automated thermal breach response for Gorakhpur
          </p>
        </div>

        {activeBreachesCount > 0 && (
          <div className="bg-red-600/90 text-white px-3 py-1.5 rounded border border-red-400 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <AlertTriangle className="w-4 h-4" />
            <span>{activeBreachesCount} ACTIVE THERMAL BREACH DETECTED</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <nav className="px-6 bg-slate-900/60 border-t border-slate-800 flex gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-amber-400 text-amber-400 bg-slate-800/80'
              : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          SYSTEM OVERVIEW
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'inventory'
              ? 'border-amber-400 text-amber-400 bg-slate-800/80'
              : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          FACILITY INVENTORY
        </button>

        <button
          onClick={() => setActiveTab('scanner')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'scanner'
              ? 'border-amber-400 text-amber-400 bg-slate-800/80'
              : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          LOGISTICS SCANNER
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'simulator'
              ? 'border-amber-400 text-amber-400 bg-slate-800/80'
              : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          VIRTUAL IoT SIMULATOR
        </button>
      </nav>
    </header>
  );
};
