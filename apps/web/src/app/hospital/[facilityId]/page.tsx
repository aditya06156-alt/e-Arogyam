'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { useAuth } from '@/components/AuthProvider';
import { GovernmentHeader } from '@/components/GovernmentHeader';
import { KPICards } from '@/components/KPICards';
import { InventorySummaryBar } from '@/components/InventorySummaryBar';
import { ThermalMonitoringPanel } from '@/components/ThermalMonitoringPanel';
import { LogisticsScanner } from '@/components/LogisticsScanner';
import { SimulatorControlPanel } from '@/components/SimulatorControlPanel';
import { BatchTraceModal } from '@/components/BatchTraceModal';
import { DashboardOverview, Batch, Facility, TelemetryReading } from '@/lib/types';
import { Search, Building2, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api/v1';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export default function HospitalDashboardPage() {
  const params = useParams();
  const facilityId = params.facilityId as string;
  const router = useRouter();
  const { user, loading } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [isConnected, setIsConnected] = useState(false);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryReading[]>([]);
  const [selectedTraceBatchId, setSelectedTraceBatchId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    try {
      const [batchesRes, facilitiesRes, telemetryRes] = await Promise.all([
        fetch(`${API_BASE}/batches`).then(r => r.json()),
        fetch(`${API_BASE}/facilities`).then(r => r.json()),
        fetch(`${API_BASE}/telemetry/history`).then(r => r.json()),
      ]);

      if (batchesRes.success) setAllBatches(batchesRes.data);
      if (facilitiesRes.success) {
        setFacilities(facilitiesRes.data);
        const currentFac = facilitiesRes.data.find((f: Facility) => f.id === facilityId);
        setFacility(currentFac || null);
      }
      if (telemetryRes.success) {
        // Filter telemetry for this facility
        setTelemetryHistory(telemetryRes.data.filter((t: TelemetryReading) => t.facilityId === facilityId));
      }
    } catch (err) {
      console.error('Data fetch error:', err);
    }
  };

  useEffect(() => {
    if (facilityId) {
      fetchData();
    }

    const socket = io(WS_URL, {
      path: '/realtime/v1',
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('temperature.updated', (event: any) => {
      if (event.data.facilityId === facilityId) {
        setTelemetryHistory(prev => [...prev.slice(-30), {
          deviceId: event.data.deviceId,
          facilityId: event.data.facilityId,
          batchId: event.data.batchId,
          temperature: event.data.temperature,
          unit: 'CELSIUS',
          timestamp: event.data.timestamp
        }]);
      }
    });

    socket.on('thermal.breach', () => fetchData());
    socket.on('inventory.updated', () => fetchData());

    return () => {
      socket.disconnect();
    };
  }, [facilityId]);

  // Filter batches to current hospital facility only
  const hospitalBatches = allBatches.filter(b => b.currentFacilityId === facilityId);

  // Compute scoped overview metrics
  const totalStock = hospitalBatches.reduce((acc, b) => acc + b.quantity, 0);
  const activeBreaches = hospitalBatches.filter(b => b.status === 'SPOILED').length;
  const criticalStockouts = hospitalBatches.filter(b => b.quantity < 100).length;
  const expiring30Days = hospitalBatches.filter(b => b.status === 'EXPIRING_30').length;

  const hospitalOverview: DashboardOverview = {
    totalInventory: totalStock,
    criticalStockouts,
    expiring30Days,
    expiring60Days: 0,
    expiring90Days: 0,
    activeBreaches
  };

  const filteredBatches = hospitalBatches.filter(b => {
    const matchesSearch = b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.medicine?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-sans text-xs">
        Loading Hospital Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-govt-gray font-sans pb-12 text-slate-800">
      <GovernmentHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        activeBreachesCount={activeBreaches}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        {/* Scoped Hospital Title Banner */}
        <div className="bg-white border-l-4 border-govt-navy border-t border-r border-b border-slate-200 p-4 rounded-r shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <div className="flex items-center gap-2 text-govt-navy font-extrabold text-base">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>{facility?.name || 'Hospital Facility Dashboard'}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gorakhpur District • Dedicated Facility Inventory & Thermal Monitoring Portal
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Master Admin View</span>
              </Link>
            )}

            <div className="bg-slate-100 px-3 py-1.5 rounded border text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>FACILITY SCOPED VIEW</span>
            </div>
          </div>
        </div>

        <KPICards overview={hospitalOverview} />

        {/* Tab 1: System Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <InventorySummaryBar batches={hospitalBatches} />
            <ThermalMonitoringPanel telemetryHistory={telemetryHistory} />
          </div>
        )}

        {/* Tab 2: Facility Inventory Table */}
        {activeTab === 'inventory' && (
          <div className="bg-white border border-govt-border rounded-govt p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 mb-3 border-b border-slate-200 gap-3">
              <h3 className="font-bold text-govt-navy uppercase text-xs tracking-wider">
                {facility?.name} — Current Batches Inventory
              </h3>

              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search batch or medicine..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-govt-border rounded bg-slate-50 focus:bg-white"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-govt-border rounded bg-slate-50 font-medium"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="EXPIRING_30">Expiring ≤30d</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="SPOILED">Spoiled/Breached</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-govt-navy font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Batch Number</th>
                    <th className="py-2.5 px-3">Medicine / Vaccine</th>
                    <th className="py-2.5 px-3 text-right">Stock Quantity</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Expiry Date</th>
                    <th className="py-2.5 px-3 text-center">Audit Trace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400">
                        No batches found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-govt-navy">{b.batchNumber}</td>
                        <td className="py-2.5 px-3">{b.medicine?.name || b.medicineId}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">{b.quantity.toLocaleString()}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            b.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                            b.status === 'SPOILED' ? 'bg-rose-100 text-rose-800' :
                            b.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                            b.status === 'EXPIRING_30' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono">{b.expiryDate}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => setSelectedTraceBatchId(b.id)}
                            className="bg-slate-200 hover:bg-govt-navy hover:text-white text-slate-800 font-bold px-2 py-1 rounded text-[10px] transition-colors"
                          >
                            View Trace
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Logistics Scanner */}
        {activeTab === 'scanner' && (
          <LogisticsScanner
            apiBase={API_BASE}
            batches={hospitalBatches}
            facilities={facilities}
            onTransactionComplete={fetchData}
          />
        )}

        {/* Tab 4: Virtual IoT Simulator */}
        {activeTab === 'simulator' && (
          <SimulatorControlPanel
            apiBase={API_BASE}
            batches={hospitalBatches}
            facilities={facilities}
            onBreachTriggered={fetchData}
          />
        )}
      </main>

      {selectedTraceBatchId && (
        <BatchTraceModal
          batchId={selectedTraceBatchId}
          onClose={() => setSelectedTraceBatchId(null)}
          apiBase={API_BASE}
        />
      )}
    </div>
  );
}
