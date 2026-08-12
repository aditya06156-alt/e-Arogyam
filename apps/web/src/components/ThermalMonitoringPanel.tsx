'use client';

import React from 'react';
import { Thermometer, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { TelemetryReading, Batch } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface ThermalMonitoringPanelProps {
  telemetryHistory: TelemetryReading[];
  selectedBatch?: Batch;
}

export const ThermalMonitoringPanel: React.FC<ThermalMonitoringPanelProps> = ({
  telemetryHistory,
  selectedBatch
}) => {
  const latest = telemetryHistory.length > 0 ? telemetryHistory[telemetryHistory.length - 1] : null;
  const currentTemp = latest ? latest.temperature : 5.4;
  const minRange = 2.0;
  const maxRange = 8.0;
  const isBreach = currentTemp < minRange || currentTemp > maxRange;

  const chartData = telemetryHistory.map((t, idx) => ({
    time: t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : `${idx * 5}s`,
    temp: t.temperature
  }));

  return (
    <div className="bg-white border border-govt-border rounded-govt p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-govt-navy uppercase tracking-wider flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-blue-600" />
            Live Cold-Chain Thermal Monitor
          </h2>
          <p className="text-xs text-slate-500">Continuous telemetry feed for active vaccine batches</p>
        </div>
        
        <div className={`px-3 py-1 rounded border text-xs font-bold flex items-center gap-1.5 ${
          isBreach ? 'bg-red-100 text-red-800 border-red-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
        }`}>
          {isBreach ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              <span>CRITICAL BREACH ({currentTemp}°C)</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>NORMAL ({currentTemp}°C)</span>
            </>
          )}
        </div>
      </div>

      {/* Main Temperature Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-slate-50 border border-slate-200 p-4 rounded text-center flex flex-col justify-center">
          <span className="text-xs text-slate-500 font-semibold uppercase">Current Temperature</span>
          <div className={`text-4xl font-extrabold my-1 ${isBreach ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
            {currentTemp}°C
          </div>
          <span className="text-xs font-medium text-slate-600">Configured Safe Range: {minRange}°C – {maxRange}°C</span>
        </div>

        <div className="md:col-span-2 h-44 bg-slate-50 border border-slate-200 p-2 rounded">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                <YAxis domain={[0, 20]} stroke="#64748b" fontSize={10} />
                <Tooltip />
                <ReferenceLine y={8.0} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'MAX 8°C', fill: '#dc2626', fontSize: 10 }} />
                <ReferenceLine y={2.0} stroke="#2563eb" strokeDasharray="3 3" label={{ value: 'MIN 2°C', fill: '#2563eb', fontSize: 10 }} />
                <Line type="monotone" dataKey="temp" stroke="#0f2942" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Awaiting live telemetry readings from simulator...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
