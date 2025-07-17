import React, { useState, useEffect } from 'react';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [modalLog, setModalLog] = useState<any>(null);
  const [modalType, setModalType] = useState<'view' | 'action' | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('uploadedLogs');
    if (saved) setLogs(JSON.parse(saved));
  }, []);

  const handleAction = (message: string) => {
    setActionMessage(message);
  };

  const closeModal = () => {
    setModalLog(null);
    setModalType(null);
    setShowDetails(false);
    setActionMessage(null);
  };

  return (
    <div className="p-4">
      <h1 className="text-white text-xl mb-4">Log Reports</h1>
      {logs.length === 0 ? (
        <p className="text-gray-400">No logs available. Please upload a CSV on the main dashboard first.</p>
      ) : (
        <div className="overflow-y-auto max-h-[600px] space-y-4 pr-2">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl shadow-md ${
                log.prediction === 1 ? 'bg-red-900' : 'bg-gray-800'
              } text-white flex justify-between items-center`}
            >
              <div>
                <p className="font-semibold">Log #{index + 1}</p>
                <p className="text-sm text-gray-300">Anomaly Score: {log.anomaly_score?.toFixed(4)}</p>
              </div>
              <button
                className="button-primary"
                onClick={() => {
                  setModalLog(log);
                  setModalType(log.prediction === 1 ? 'action' : 'view');
                }}
              >
                {log.prediction === 1 ? 'Action' : 'View'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-xl max-h-[80vh] overflow-y-auto relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {modalType === 'view' ? 'Log Details' : 'Available Actions'}
              </h2>
              <button onClick={closeModal} className="text-red-400 hover:text-red-200">Close</button>
            </div>

            {modalType === 'view' && (
              <div className="space-y-2 text-sm text-gray-300">
                {Object.entries(modalLog).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key}</span>
                    <span className="truncate max-w-[60%]">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}

            {modalType === 'action' && (
              <div className="space-y-4">
                <p className="text-gray-300">What would you like to do with this anomalous log?</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 text-white"
                    onClick={() => handleAction("📨 Email sent to DevOps for review.")}
                  >
                    Flag as Investigated
                  </button>
                  <button
                    className="bg-yellow-600 px-4 py-2 rounded hover:bg-yellow-500 text-white"
                    onClick={() => handleAction("⚠️ Marked as benign in system.")}
                  >
                    Mark as Benign
                  </button>
                  <button
                    className="bg-red-600 px-4 py-2 rounded hover:bg-red-500 text-white"
                    onClick={() => handleAction("🚨 Alert escalated to Security Operations Center.")}
                  >
                    Escalate to SOC
                  </button>
                  <button
                    className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-500 text-white"
                    onClick={() => handleAction("✅ Log marked as False Positive.")}
                  >
                    Mark as False Positive
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="mt-4 underline text-blue-400 hover:text-blue-200"
                  >
                    {showDetails ? 'Hide Log Details' : 'Review Log'}
                  </button>
                </div>

                {showDetails && (
                  <div className="mt-4 space-y-2 text-sm text-gray-300">
                    {Object.entries(modalLog).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium">{key}</span>
                        <span className="truncate max-w-[60%]">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Feedback message */}
            {actionMessage && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-green-300 text-sm px-4 py-2 rounded shadow-lg flex items-center justify-between gap-4">
                <span>{actionMessage}</span>
                <button onClick={() => setActionMessage(null)} className="text-red-400 hover:text-red-200 text-xs">
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
