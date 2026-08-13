'use client';

import React from 'react';
import { Package, AlertTriangle, AlertOctagon, Clock, ArrowRight } from 'lucide-react';
import { DashboardOverview } from '@/lib/types';
import { usePreferences } from '@/lib/PreferencesContext';

interface KPICardsProps {
  overview: DashboardOverview;
  onCardClick?: (filterType: string) => void;
}

export const KPICards: React.FC<KPICardsProps> = ({ overview, onCardClick }) => {
  const { t } = usePreferences();

  const handleClick = (filterType: string) => {
    if (onCardClick) onCardClick(filterType);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Total Inventory */}
      <button
        type="button"
        onClick={() => handleClick('ALL')}
        className="bg-white border border-govt-border p-4 rounded-govt shadow-sm transition-all hover:shadow-md hover:border-govt-navy text-left cursor-pointer group"
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 group-hover:text-govt-navy">{t('kpi_total_stock')}</span>
          <Package className="w-4 h-4 text-govt-navy" />
        </div>
        <div className="text-2xl font-extrabold text-govt-navy">{overview.totalInventory.toLocaleString()}</div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
          <span>{t('kpi_units_monitored')}</span>
          <ArrowRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>

      {/* 2. Active Breaches */}
      <button
        type="button"
        onClick={() => handleClick('SPOILED')}
        className={`p-4 rounded-govt border shadow-sm transition-all hover:shadow-md text-left cursor-pointer group ${
          overview.activeBreaches > 0 ? 'bg-red-50 border-red-300 text-red-900 hover:border-red-500' : 'bg-white border-govt-border hover:border-slate-400'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-red-800">{t('kpi_thermal_breaches')}</span>
          <AlertOctagon className={`w-4 h-4 ${overview.activeBreaches > 0 ? 'text-red-600 animate-pulse' : 'text-slate-400'}`} />
        </div>
        <div className={`text-2xl font-extrabold ${overview.activeBreaches > 0 ? 'text-red-700' : 'text-slate-800'}`}>
          {overview.activeBreaches}
        </div>
        <div className="text-[11px] text-red-700 mt-1 font-medium flex items-center justify-between">
          <span>{overview.activeBreaches > 0 ? `🔴 ${t('kpi_spoiled')}` : `🟢 ${t('kpi_breaches_zero')}`}</span>
          <ArrowRight className="w-3 h-3 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>

      {/* 3. Critical Stockouts */}
      <button
        type="button"
        onClick={() => handleClick('LOW_STOCK')}
        className="bg-white border border-govt-border p-4 rounded-govt shadow-sm transition-all hover:shadow-md hover:border-amber-500 text-left cursor-pointer group"
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 group-hover:text-amber-700">{t('kpi_low_stock')}</span>
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-2xl font-extrabold text-amber-700">{overview.criticalStockouts}</div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
          <span>{t('kpi_restock_needed')}</span>
          <ArrowRight className="w-3 h-3 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>

      {/* 4. Expiring in <= 60 Days */}
      <button
        type="button"
        onClick={() => handleClick('EXPIRING_60')}
        className="bg-white border border-govt-border p-4 rounded-govt shadow-sm transition-all hover:shadow-md hover:border-red-500 text-left cursor-pointer group"
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 group-hover:text-red-600">{t('kpi_expiring_60')}</span>
          <Clock className="w-4 h-4 text-red-500" />
        </div>
        <div className="text-2xl font-extrabold text-red-600">{overview.expiring60Days}</div>
        <div className="text-[11px] text-red-600 mt-1 font-medium flex items-center justify-between">
          <span>{t('kpi_crit_expiry')}</span>
          <ArrowRight className="w-3 h-3 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>

      {/* 5. Expiring in 61-90 Days */}
      <button
        type="button"
        onClick={() => handleClick('EXPIRING_90')}
        className="bg-white border border-govt-border p-4 rounded-govt shadow-sm transition-all hover:shadow-md hover:border-amber-500 text-left cursor-pointer group"
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 group-hover:text-amber-600">{t('kpi_expiring_90')}</span>
          <Clock className="w-4 h-4 text-amber-500" />
        </div>
        <div className="text-2xl font-extrabold text-amber-600">{overview.expiring90Days}</div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
          <span>{t('kpi_sec_window')}</span>
          <ArrowRight className="w-3 h-3 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>

      {/* 6. Expiring in 91-120 Days */}
      <button
        type="button"
        onClick={() => handleClick('EXPIRING_120')}
        className="bg-white border border-govt-border p-4 rounded-govt shadow-sm transition-all hover:shadow-md hover:border-blue-500 text-left cursor-pointer group"
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 group-hover:text-blue-600">{t('kpi_expiring_120')}</span>
          <Clock className="w-4 h-4 text-blue-500" />
        </div>
        <div className="text-2xl font-extrabold text-blue-700">{overview.expiring120Days || 0}</div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
          <span>{t('kpi_mon_window')}</span>
          <ArrowRight className="w-3 h-3 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>
    </div>
  );
};
