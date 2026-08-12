'use client';

import React from 'react';
import { Package, AlertTriangle, AlertOctagon, Clock, ShieldAlert } from 'lucide-react';
import { DashboardOverview } from '@/lib/types';

interface KPICardsProps {
  overview: DashboardOverview;
}

export const KPICards: React.FC<KPICardsProps> = ({ overview }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Total Inventory */}
      <div className="bg-white border border-govt-border p-4 rounded-govt shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Stock</span>
          <Package className="w-4 h-4 text-govt-navy" />
        </div>
        <div className="text-2xl font-extrabold text-govt-navy">{overview.totalInventory.toLocaleString()}</div>
        <div className="text-[11px] text-slate-500 mt-1">Units monitored</div>
      </div>

      {/* 2. Active Breaches */}
      <div className={`p-4 rounded-govt border shadow-sm ${
        overview.activeBreaches > 0 ? 'bg-red-50 border-red-300 text-red-900' : 'bg-white border-govt-border'
      }`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-red-800">Thermal Breaches</span>
          <AlertOctagon className={`w-4 h-4 ${overview.activeBreaches > 0 ? 'text-red-600' : 'text-slate-400'}`} />
        </div>
        <div className={`text-2xl font-extrabold ${overview.activeBreaches > 0 ? 'text-red-700' : 'text-slate-800'}`}>
          {overview.activeBreaches}
        </div>
        <div className="text-[11px] text-red-700 mt-1 font-medium">
          {overview.activeBreaches > 0 ? '🔴 Batches SPOILED' : '🟢 0 Breaches active'}
        </div>
      </div>

      {/* 3. Critical Stockouts */}
      <div className="bg-white border border-govt-border p-4 rounded-govt shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Low Stock (&lt;100)</span>
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-2xl font-extrabold text-amber-700">{overview.criticalStockouts}</div>
        <div className="text-[11px] text-slate-500 mt-1">Batches require restock</div>
      </div>

      {/* 4. Expiring in 30 Days */}
      <div className="bg-white border border-govt-border p-4 rounded-govt shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Expiring &le;30d</span>
          <Clock className="w-4 h-4 text-red-500" />
        </div>
        <div className="text-2xl font-extrabold text-red-600">{overview.expiring30Days}</div>
        <div className="text-[11px] text-red-600 mt-1 font-medium">Critical Expiry Window</div>
      </div>

      {/* 5. Expiring in 60 Days */}
      <div className="bg-white border border-govt-border p-4 rounded-govt shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Expiring 31–60d</span>
          <Clock className="w-4 h-4 text-amber-500" />
        </div>
        <div className="text-2xl font-extrabold text-amber-600">{overview.expiring60Days}</div>
        <div className="text-[11px] text-slate-500 mt-1">Secondary Window</div>
      </div>

      {/* 6. Expiring in 90 Days */}
      <div className="bg-white border border-govt-border p-4 rounded-govt shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Expiring 61–90d</span>
          <Clock className="w-4 h-4 text-blue-500" />
        </div>
        <div className="text-2xl font-extrabold text-blue-700">{overview.expiring90Days}</div>
        <div className="text-[11px] text-slate-500 mt-1">Monitored Window</div>
      </div>
    </div>
  );
};
