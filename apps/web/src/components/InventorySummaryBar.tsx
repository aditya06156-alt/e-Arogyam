'use client';

import React from 'react';
import { Package, AlertOctagon, ShieldAlert, Clock, Layers } from 'lucide-react';
import { Batch } from '@/lib/types';

interface InventorySummaryBarProps {
  batches: Batch[];
}

export const InventorySummaryBar: React.FC<InventorySummaryBarProps> = ({ batches }) => {
  // Aggregate inventory statistics directly from current batch list
  const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);
  const totalBatches = batches.length;

  const expiredBatches = batches.filter(b => b.status === 'EXPIRED');
  const expiredCount = expiredBatches.length;
  const expiredUnits = expiredBatches.reduce((sum, b) => sum + b.quantity, 0);

  const spoiledBatches = batches.filter(b => b.status === 'SPOILED');
  const spoiledCount = spoiledBatches.length;
  const spoiledUnits = spoiledBatches.reduce((sum, b) => sum + b.quantity, 0);

  const expiringBatches = batches.filter(b => b.status === 'EXPIRING_30' || b.status === 'EXPIRING_60');
  const expiringCount = expiringBatches.length;
  const expiringUnits = expiringBatches.reduce((sum, b) => sum + b.quantity, 0);

  return (
    <div className="bg-white border border-govt-border rounded-govt p-4 shadow-sm mb-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
        <h2 className="text-xs font-bold text-govt-navy uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          Gorakhpur District Inventory Overview Summary
        </h2>
        <span className="text-[11px] text-slate-500 font-medium">
          Monitored Facilities: BRD Medical College • AIIMS Gorakhpur • NSCB District Hospital
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Total Stock */}
        <div className="bg-slate-50 border-l-4 border-govt-navy border-t border-r border-b border-slate-200 p-3 rounded-r select-none">
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-govt-navy">Total Inventory Stock</span>
            <Package className="w-4 h-4 text-govt-navy" />
          </div>
          <div className="text-2xl font-extrabold text-govt-navy">
            {totalStock.toLocaleString()} <span className="text-xs font-normal text-slate-600">units</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Distributed across <span className="font-semibold text-slate-700">{totalBatches} batches</span>
          </div>
        </div>

        {/* 2. Expired Batches */}
        <div className="bg-slate-50 border-l-4 border-red-600 border-t border-r border-b border-slate-200 p-3 rounded-r select-none">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700">Expired Inventory</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-extrabold text-red-700">
            {expiredCount} <span className="text-xs font-normal text-slate-600">{expiredCount === 1 ? 'batch' : 'batches'}</span>
          </div>
          <div className="text-[11px] text-red-600 mt-1 font-medium">
            {expiredCount > 0 ? `⚠️ ${expiredUnits} units expired (pending disposal)` : '🟢 Zero expired stock'}
          </div>
        </div>

        {/* 3. Spoiled / Thermal Breached Batches */}
        <div className="bg-slate-50 border-l-4 border-rose-600 border-t border-r border-b border-slate-200 p-3 rounded-r select-none">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Thermal Breached (Spoiled)</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-800">
            {spoiledCount} <span className="text-xs font-normal text-slate-600">{spoiledCount === 1 ? 'batch' : 'batches'}</span>
          </div>
          <div className="text-[11px] text-rose-700 mt-1 font-medium">
            {spoiledCount > 0 ? `🔴 ${spoiledUnits} units quarantined (thermal breach)` : '🟢 Zero thermal breaches'}
          </div>
        </div>

        {/* 4. Expiring Soon */}
        <div className="bg-slate-50 border-l-4 border-amber-500 border-t border-r border-b border-slate-200 p-3 rounded-r select-none">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Expiring &le; 30-60 Days</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800">
            {expiringCount} <span className="text-xs font-normal text-slate-600">{expiringCount === 1 ? 'batch' : 'batches'}</span>
          </div>
          <div className="text-[11px] text-amber-700 mt-1 font-medium">
            {expiringCount > 0 ? `🟡 ${expiringUnits} units near expiration window` : '🟢 Stock fresh'}
          </div>
        </div>
      </div>
    </div>
  );
};
