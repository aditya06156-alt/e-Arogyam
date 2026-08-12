'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, QrCode, ArrowDownRight, ArrowUpRight, Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, Package, X, Video } from 'lucide-react';
import { parseGS1Barcode } from '@/lib/utils';
import { Batch, Facility } from '@/lib/types';

interface LogisticsScannerProps {
  apiBase: string;
  batches: Batch[];
  facilities: Facility[];
  onTransactionComplete: () => void;
}

export const LogisticsScanner: React.FC<LogisticsScannerProps> = ({
  apiBase,
  batches,
  facilities,
  onTransactionComplete
}) => {
  const [scannedRaw, setScannedRaw] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(10);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live Camera Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrcodeRef = useRef<any>(null);

  // Sample GS1 Barcodes for quick manual testing
  const sampleBarcodes = [
    { label: 'JE Vaccine (BRD Medical)', code: '(01)08901234567890(10)JE-BRD-001(17)270610' },
    { label: 'Covaxin (BRD Medical)', code: '(01)08901234567890(10)COV-BRD-003(17)260828' },
    { label: 'Insulin (AIIMS Gorakhpur)', code: '(01)08901234567892(10)INS-AIIMS-007(17)270110' },
    { label: 'TB Combo (NSCB Hospital)', code: '(01)08901234567893(10)TB-NSCB-011(17)270801' }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('earogyam_offline_queue');
    if (saved) {
      try { setOfflineQueue(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('earogyam_offline_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  // Handle barcode string change
  const handleBarcodeChange = (raw: string) => {
    setScannedRaw(raw);
    setStatusMessage(null);
    if (!raw.trim()) {
      setParsedData(null);
      return;
    }

    const parsed = parseGS1Barcode(raw);
    setParsedData(parsed);

    const matched = batches.find(b =>
      b.batchNumber.toLowerCase() === (parsed.batchNumber || '').toLowerCase() ||
      b.id === parsed.batchNumber
    );

    if (matched) {
      setSelectedBatchId(matched.id);
      setSelectedFacilityId(matched.currentFacilityId);
    }
  };

  // Start Real Camera Scanner via html5-qrcode
  const startCameraScanner = async () => {
    setIsCameraActive(true);
    setCameraError(null);

    // Wait for DOM element rendering
    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const qrScanner = new Html5Qrcode('camera-reader');
        html5QrcodeRef.current = qrScanner;

        await qrScanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            handleBarcodeChange(decodedText);
            stopCameraScanner();
          },
          () => {} // silent frame read errors
        );
      } catch (err: any) {
        console.error('Camera Scanner Error:', err);
        setCameraError(err.message || 'Camera permission denied or camera not found on device.');
      }
    }, 200);
  };

  // Stop Camera Scanner
  const stopCameraScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (err) {
        console.warn('Camera stop warning:', err);
      }
      html5QrcodeRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Log transaction
  const handleLogTransaction = async (type: 'INWARD' | 'OUTWARD') => {
    setStatusMessage(null);
    const targetBatch = batches.find(b => b.id === selectedBatchId);
    if (!targetBatch) {
      setStatusMessage({ type: 'error', text: 'Please select a valid batch before logging movement.' });
      return;
    }

    if (type === 'OUTWARD' && targetBatch.status === 'SPOILED') {
      setStatusMessage({ type: 'error', text: `❌ BLOCKED: Cannot dispense batch ${targetBatch.batchNumber} because it is marked SPOILED due to a thermal breach.` });
      return;
    }

    if (type === 'OUTWARD' && targetBatch.quantity < quantity) {
      setStatusMessage({ type: 'error', text: `❌ INSUFFICIENT STOCK: Available (${targetBatch.quantity}) is less than requested (${quantity}).` });
      return;
    }

    const txnPayload = {
      clientTransactionId: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      batchId: targetBatch.id,
      facilityId: selectedFacilityId || targetBatch.currentFacilityId,
      type,
      quantity: Number(quantity),
      scannedAt: new Date().toISOString()
    };

    if (isOfflineMode) {
      setOfflineQueue(prev => [...prev, { ...txnPayload, batchNumber: targetBatch.batchNumber, status: 'PENDING_OFFLINE' }]);
      setStatusMessage({
        type: 'success',
        text: `📱 OFFLINE SCAN RECORDED: ${type} ${quantity} units for ${targetBatch.batchNumber}. Saved to local device queue (${offlineQueue.length + 1} pending sync).`
      });
    } else {
      try {
        const res = await fetch(`${apiBase}/transactions/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(txnPayload)
        });

        const data = await res.json();
        if (data.success) {
          setStatusMessage({
            type: 'success',
            text: `✅ ONLINE SCAN SUCCESS: ${type} ${quantity} units of ${targetBatch.batchNumber} recorded on server.`
          });
          onTransactionComplete();
        } else {
          setStatusMessage({ type: 'error', text: `Transaction failed: ${data.error?.message}` });
        }
      } catch (err) {
        setOfflineQueue(prev => [...prev, { ...txnPayload, batchNumber: targetBatch.batchNumber, status: 'PENDING_OFFLINE' }]);
        setStatusMessage({
          type: 'success',
          text: `⚠️ Network unreachable. Transaction saved to offline device queue (${offlineQueue.length + 1} pending).`
        });
      }
    }
  };

  // Sync offline queued transactions
  const handleSyncQueue = async () => {
    if (offlineQueue.length === 0) return;
    setIsSyncing(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`${apiBase}/transactions/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: offlineQueue })
      });

      const data = await res.json();
      if (data.success) {
        setOfflineQueue([]);
        setStatusMessage({
          type: 'success',
          text: `🎉 SYNC COMPLETE: Successfully synchronized ${offlineQueue.length} offline transactions to Neon DB!`
        });
        onTransactionComplete();
      } else {
        setStatusMessage({ type: 'error', text: 'Sync failed on server.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Server unreachable for sync.' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white border-2 border-govt-navy rounded-govt shadow-sm p-5 text-xs">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 mb-5 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-base font-bold text-govt-navy flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            Logistics Barcode & Live Camera Scanner Portal
          </h2>
          <p className="text-xs text-slate-500">
            Scan GS1 DataMatrix / QR codes using device camera or manual input (Inward receipt & Outward hospital dispensing)
          </p>
        </div>

        <button
          onClick={() => setIsOfflineMode(!isOfflineMode)}
          className={`px-3 py-1.5 rounded font-bold flex items-center gap-2 border text-xs transition-colors ${
            isOfflineMode
              ? 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200'
              : 'bg-emerald-100 text-emerald-900 border-emerald-400 hover:bg-emerald-200'
          }`}
        >
          {isOfflineMode ? (
            <>
              <WifiOff className="w-4 h-4 text-amber-700" />
              <span>MODE: OFFLINE (LOCAL DEVICE QUEUE)</span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4 text-emerald-700" />
              <span>MODE: ONLINE (DIRECT SERVER SYNC)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left Column: Barcode & Camera Scanner Button */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                GS1 DataMatrix / Barcode Input
              </label>

              {/* REAL CAMERA SCANNER BUTTON */}
              <button
                type="button"
                onClick={startCameraScanner}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded flex items-center gap-1 text-[11px] transition-colors"
              >
                <Video className="w-3.5 h-3.5" />
                <span>OPEN CAMERA SCANNER</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Scan with camera or type GS1 barcode string..."
                value={scannedRaw}
                onChange={(e) => handleBarcodeChange(e.target.value)}
                className="w-full p-2.5 pr-8 border border-govt-border rounded bg-slate-50 font-mono text-xs text-slate-900 focus:bg-white"
              />
              <QrCode className="w-4 h-4 absolute right-2.5 top-3 text-slate-400" />
            </div>
          </div>

          {/* Quick Demo Barcode Buttons */}
          <div>
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Quick Test GS1 Barcodes:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {sampleBarcodes.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleBarcodeChange(sample.code)}
                  className="p-2 border border-slate-200 bg-slate-50 hover:bg-blue-50/80 rounded text-left transition-colors"
                >
                  <span className="font-bold block text-slate-800 text-[11px]">{sample.label}</span>
                  <span className="font-mono text-[10px] text-slate-500 truncate block">{sample.code}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Parsed Data Preview */}
          {parsedData && (
            <div className="bg-blue-50/60 border border-blue-200 p-3 rounded space-y-1">
              <span className="font-bold text-govt-navy block text-xs">Parsed GS1 Barcode Data:</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-slate-500">Matched Batch:</span> <strong className="text-slate-900">{parsedData.batchNumber || 'N/A'}</strong></div>
                <div><span className="text-slate-500">GTIN/SKU:</span> <strong className="text-slate-900">{parsedData.gtin || 'N/A'}</strong></div>
                <div><span className="text-slate-500">Expiry Date:</span> <strong className="text-slate-900">{parsedData.expiryDate || 'N/A'}</strong></div>
                <div><span className="text-slate-500">Serial No:</span> <strong className="text-slate-900">{parsedData.serialNumber || 'N/A'}</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Transaction Form */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-govt-navy text-sm mb-3">Record Stock Movement</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Target Batch</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => {
                    setSelectedBatchId(e.target.value);
                    const b = batches.find(x => x.id === e.target.value);
                    if (b) setSelectedFacilityId(b.currentFacilityId);
                  }}
                  className="w-full p-2 border border-govt-border rounded bg-white font-medium text-xs text-slate-900"
                >
                  <option value="">-- Select Batch --</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.batchNumber} — {b.medicine?.name} ({b.quantity} units, {b.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Hospital Facility</label>
                <select
                  value={selectedFacilityId}
                  onChange={(e) => setSelectedFacilityId(e.target.value)}
                  className="w-full p-2 border border-govt-border rounded bg-white font-medium text-xs text-slate-900"
                >
                  {facilities.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full p-2 border border-govt-border rounded bg-white font-bold text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleLogTransaction('INWARD')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-3 rounded flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <ArrowDownRight className="w-4 h-4" />
              INWARD (+{quantity})
            </button>

            <button
              onClick={() => handleLogTransaction('OUTWARD')}
              className="bg-govt-navy hover:bg-govt-blue text-white font-bold py-2.5 px-3 rounded flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <ArrowUpRight className="w-4 h-4" />
              OUTWARD (-{quantity})
            </button>
          </div>
        </div>
      </div>

      {/* Status Feedback Alert */}
      {statusMessage && (
        <div className={`p-3 rounded border mb-5 font-semibold text-xs flex items-center gap-2 ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-red-50 text-red-900 border-red-300'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Offline Pending Queue */}
      <div className="border border-slate-200 rounded overflow-hidden">
        <div className="bg-slate-100 px-4 py-2.5 flex justify-between items-center border-b border-slate-200">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Package className="w-4 h-4 text-amber-600" />
            <span>Local Device Sync Queue ({offlineQueue.length} pending)</span>
          </div>

          {offlineQueue.length > 0 && (
            <button
              onClick={handleSyncQueue}
              disabled={isSyncing}
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>SYNC QUEUE TO NEON DB NOW</span>
            </button>
          )}
        </div>

        <div className="p-3 bg-slate-50 font-mono text-[11px] divide-y divide-slate-200 max-h-36 overflow-y-auto">
          {offlineQueue.length === 0 ? (
            <div className="text-slate-400 text-center py-2 font-sans">No pending offline transactions in queue.</div>
          ) : (
            offlineQueue.map((item, idx) => (
              <div key={idx} className="py-1.5 flex justify-between items-center">
                <span className="font-bold text-slate-800">{item.batchNumber}</span>
                <span className={`px-2 py-0.5 rounded font-sans font-bold text-[10px] ${
                  item.type === 'INWARD' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {item.type} ({item.quantity} units)
                </span>
                <span className="text-slate-400">{new Date(item.scannedAt).toLocaleTimeString()}</span>
                <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-sans text-[10px] font-bold">
                  PENDING SYNC
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* REAL CAMERA SCANNER MODAL */}
      {isCameraActive && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-5 text-white shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Video className="w-4 h-4 text-amber-400" />
                Live Camera Barcode & QR Scanner
              </h3>
              <button
                onClick={stopCameraScanner}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cameraError ? (
              <div className="bg-red-950 border border-red-800 p-4 rounded text-red-200 text-xs">
                <AlertCircle className="w-5 h-5 text-red-400 mb-2" />
                <p className="font-bold">Camera Access Error:</p>
                <p className="mt-1">{cameraError}</p>
                <button
                  onClick={stopCameraScanner}
                  className="mt-3 bg-red-800 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs"
                >
                  Close Modal
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-400 mb-3">
                  Align the QR code or DataMatrix barcode inside the scanning viewfinder:
                </p>
                <div id="camera-reader" className="w-full h-64 bg-slate-950 rounded overflow-hidden border border-slate-800" />
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={stopCameraScanner}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-1.5 px-4 rounded text-xs transition-colors"
              >
                Cancel / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
