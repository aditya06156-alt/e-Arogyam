'use client';

import React from 'react';
import { X, ShieldAlert, CheckCircle, Clock, FileText, ArrowRight } from 'lucide-react';

interface BatchTraceModalProps {
  batchId: string;
  onClose: () => void;
  apiBase: string;
}

export const BatchTraceModal: React.FC<BatchTraceModalProps> = ({ batchId, onClose, apiBase }) => {
  const [traceData, setTraceData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`${apiBase}/batches/${batchId}/trace`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTraceData(data.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [batchId, apiBase]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-govt-navy rounded-govt w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-govt-navy text-white px-5 py-3 flex justify-between items-center border-b border-slate-700">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              Authoritative Batch Chain-of-Custody Audit Trace
            </h3>
            <p className="text-xs text-slate-300">Batch ID: {batchId}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading batch trace timeline...</div>
          ) : traceData ? (
            <div>
              {/* Batch Summary Box */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded mb-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Batch Number</span>
                  <span className="font-bold text-slate-900 text-sm">{traceData.batch?.batchNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Medicine</span>
                  <span className="font-semibold text-slate-800">{traceData.batch?.medicine?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                    traceData.batch?.status === 'SPOILED'
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {traceData.batch?.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Current Stock</span>
                  <span className="font-bold text-slate-800">{traceData.batch?.quantity} units</span>
                </div>
              </div>

              {/* Timeline */}
              <h4 className="font-bold text-govt-navy uppercase tracking-wider mb-3 text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Chronological Audit History
              </h4>

              <div className="relative pl-6 border-l-2 border-slate-300 space-y-4">
                {traceData.timeline?.map((item: any, idx: number) => {
                  const isBreach = item.type.includes('BREACH') || item.type.includes('SPOILED');
                  return (
                    <div key={idx} className="relative">
                      <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                        isBreach ? 'border-red-600 bg-red-100' : 'border-govt-navy'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isBreach ? 'bg-red-600' : 'bg-govt-navy'}`} />
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-bold uppercase tracking-wider text-[11px] ${
                            isBreach ? 'text-red-700' : 'text-govt-navy'
                          }`}>
                            {item.type}
                          </span>
                          <span className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-700">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">Could not retrieve audit trace.</div>
          )}
        </div>
      </div>
    </div>
  );
};
