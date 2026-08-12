'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, Zap, RotateCcw, AlertOctagon, CheckCircle2, Play, Square, Activity, Send } from 'lucide-react';
import { VirtualDevice, Batch, Facility } from '@pharma/types';

interface SimulatorControlPanelProps {
  apiBase: string;
  batches: Batch[];
  facilities: Facility[];
  onBreachTriggered?: () => void;
}

export const SimulatorControlPanel: React.FC<SimulatorControlPanelProps> = ({
  apiBase,
  batches,
  facilities,
  onBreachTriggered
}) => {
  const [isRunning, setIsRunning] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState('VIRTUAL-SENSOR-001');
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || 'batch-vx-001');
  const [selectedFacilityId, setSelectedFacilityId] = useState(facilities[0]?.id || 'fac-hosp-01');
  const [currentTemperature, setCurrentTemperature] = useState(5.4);
  const [isBreachState, setIsBreachState] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [eventLog, setEventLog] = useState<{ id: string; time: string; temp: number; status: string }[]>([]);
  const [lastDeliveredTime, setLastDeliveredTime] = useState<string | null>(null);

  const selectedBatch = batches.find(b => b.id === selectedBatchId) || batches[0];
  const selectedFacility = facilities.find(f => f.id === selectedFacilityId) || facilities[0];

  // 5-second Telemetry Loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // Small fluctuation around 5.2 - 5.6 if normal, or keep 18.0 if breach state
      let tempToSend = currentTemperature;
      if (!isBreachState) {
        tempToSend = Number((5.0 + Math.random() * 0.8).toFixed(1));
        setCurrentTemperature(tempToSend);
      }

      sendTelemetry(tempToSend);
    }, 5000);

    return () => clearInterval(interval);
  }, [isRunning, currentTemperature, isBreachState, selectedBatchId, selectedFacilityId]);

  const sendTelemetry = async (temp: number) => {
    const timestamp = new Date().toISOString();
    try {
      const res = await fetch(`${apiBase}/telemetry/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: selectedDevice,
          facilityId: selectedFacilityId,
          batchId: selectedBatchId,
          temperature: temp,
          unit: 'CELSIUS',
          timestamp
        })
      });

      const data = await res.json();
      const statusStr = data.data?.status || (temp > 8 ? 'BREACH' : 'NORMAL');
      
      setLastDeliveredTime(new Date().toLocaleTimeString());
      setEventLog(prev => [
        {
          id: `log-${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          temp,
          status: statusStr
        },
        ...prev.slice(0, 19)
      ]);

      if (statusStr === 'BREACH' && onBreachTriggered) {
        onBreachTriggered();
      }
    } catch (err) {
      console.error('Failed to send telemetry:', err);
    }
  };

  const handleTriggerBreach = async () => {
    setShowConfirmModal(false);
    setIsBreachState(true);
    setCurrentTemperature(18.0);

    // Send immediate breach telemetry
    await sendTelemetry(18.0);
  };

  const handleResetSimulator = async () => {
    setIsBreachState(false);
    setCurrentTemperature(5.4);

    try {
      await fetch(`${apiBase}/simulator/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: selectedBatchId })
      });
      sendTelemetry(5.4);
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  return (
    <div className="bg-white border-2 border-govt-navy rounded-govt shadow-sm p-5 text-xs">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 mb-5 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-base font-bold text-govt-navy flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            Virtual IoT Hardware Simulator & Telemetry Generator
          </h2>
          <p className="text-xs text-slate-500">
            Mock hardware layer sending live sensor readings to telemetry ingest pipeline
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-3 py-1.5 rounded font-bold flex items-center gap-1.5 border text-xs ${
              isRunning
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>PAUSE SIMULATION</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>RESUME SIMULATION</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Device & Batch Selector Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Virtual Sensor Device
          </label>
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="w-full p-2 border border-govt-border rounded bg-slate-50 text-slate-900 font-medium"
          >
            <option value="VIRTUAL-SENSOR-001">VIRTUAL-SENSOR-001 (Cold Storage A)</option>
            <option value="VIRTUAL-SENSOR-002">VIRTUAL-SENSOR-002 (Refrigerated Van B)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Assigned Facility
          </label>
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="w-full p-2 border border-govt-border rounded bg-slate-50 text-slate-900 font-medium"
          >
            {facilities.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.district})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Monitored Batch
          </label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="w-full p-2 border border-govt-border rounded bg-slate-50 text-slate-900 font-medium"
          >
            {batches.map(b => (
              <option key={b.id} value={b.id}>
                {b.batchNumber} — {b.quantity} units ({b.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Current Temperature Readout & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Readout Card */}
        <div className={`p-5 rounded border text-center flex flex-col justify-center ${
          isBreachState ? 'bg-red-50 border-red-300 text-red-900' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Simulated Sensor Reading</span>
          <div className={`text-5xl font-extrabold my-2 ${isBreachState ? 'text-red-700 animate-pulse' : 'text-govt-navy'}`}>
            {currentTemperature}°C
          </div>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className={`px-2.5 py-0.5 rounded font-bold text-xs uppercase ${
              isBreachState ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {isBreachState ? 'CRITICAL THERMAL BREACH' : 'NORMAL OPERATING RANGE'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Configured Threshold: 2.0°C Min — 8.0°C Max</p>
        </div>

        {/* Action Controls */}
        <div className="bg-slate-50 border border-slate-200 p-5 rounded flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Demonstration Controls</h3>
            <p className="text-slate-500 text-xs mb-4">
              Simulate a thermal failure to exercise the Rule Engine, SPOILED status mutation, and SMS alert dispatch.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowConfirmModal(true)}
              className="flex-1 bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 px-4 rounded flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Zap className="w-4 h-4 fill-current" />
              TRIGGER THERMAL BREACH (18°C)
            </button>

            <button
              onClick={handleResetSimulator}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-4 rounded flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              RESET (5.4°C)
            </button>
          </div>
        </div>
      </div>

      {/* Telemetry Log */}
      <div className="border border-slate-200 rounded overflow-hidden">
        <div className="bg-slate-100 px-4 py-2 flex justify-between items-center border-b border-slate-200 font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            Live Simulator Ingestion Log
          </span>
          <span className="text-[11px] font-normal text-slate-500">
            Last delivered: {lastDeliveredTime || 'Just now'} (5s interval)
          </span>
        </div>

        <div className="max-h-40 overflow-y-auto bg-white p-2 font-mono text-[11px] divide-y divide-slate-100">
          {eventLog.length === 0 ? (
            <div className="text-slate-400 py-3 text-center">Waiting for first telemetry pulse...</div>
          ) : (
            eventLog.map(log => (
              <div key={log.id} className="py-1 px-2 flex justify-between items-center hover:bg-slate-50">
                <span className="text-slate-500">[{log.time}]</span>
                <span className="text-slate-900 font-bold">Reading: {log.temp}°C</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-bold ${
                  log.status === 'BREACH' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {log.status}
                </span>
                <span className="text-emerald-600 flex items-center gap-1">
                  <Send className="w-3 h-3" />
                  ACCEPTED 200 OK
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-red-600 rounded-govt max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 font-bold text-base mb-3">
              <AlertOctagon className="w-6 h-6" />
              <span>Confirm Temperature Breach Trigger?</span>
            </div>

            <div className="text-xs text-slate-700 bg-slate-50 p-3 border border-slate-200 rounded mb-4 space-y-1">
              <div><strong>Batch:</strong> {selectedBatch?.batchNumber}</div>
              <div><strong>Facility:</strong> {selectedFacility?.name}</div>
              <div><strong>Temperature Spike:</strong> <span className="text-red-700 font-bold">18.0°C</span></div>
              <p className="text-red-600 font-medium mt-2">
                ⚠️ This action will cause the Rule Engine to mark the batch as <strong>SPOILED</strong> and dispatch an SMS alert.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold rounded text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleTriggerBreach}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 font-bold rounded text-white"
              >
                Trigger Breach Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
