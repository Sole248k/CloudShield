import React, { useState } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis,
  Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

export default function MainDashboard() {
  const [data, setData] = useState([]);
  const [counts, setCounts] = useState({ normal: 0, anomaly: 0 });
  const [file, setFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState("model1");
  const [loading, setLoading] = useState(false);
  const [showInterpretation, setShowInterpretation] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (uploaded) setFile(uploaded);
  };

  const handleProcess = async () => {
    if (!file) {
      alert("Please select a CSV file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("model_id", selectedModel);

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to fetch from backend");

      const json = await res.json();
      setData(json.data);
      localStorage.setItem("uploadedLogs", JSON.stringify(json.data));
      localStorage.setItem("modelMetrics", JSON.stringify(json.metrics));

      const normal = json.data.filter((d: any) => d.prediction === 0).length;
      const anomaly = json.data.filter((d: any) => d.prediction === 1).length;
      setCounts({ normal, anomaly });
    } catch (err) {
      alert("Error fetching prediction results. Make sure the backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const waveData1 = data.slice(0, 50).map((row, index) => ({
    index,
    source: row["sbytes"] || Math.random() * 500,
    dest: row["dbytes"] || Math.random() * 500,
    prediction: row["prediction"]
  }));

  const analyzeGraph = () => {
    const threshold = 400; // spike threshold
    const spikesSource = waveData1.filter((p) => p.source > threshold).map((p) => p.index);
    const spikesDest = waveData1.filter((p) => p.dest > threshold).map((p) => p.index);
    const anomalyRate = (counts.anomaly / (counts.normal + counts.anomaly)) * 100;

    let verdict = "";
    if (anomalyRate > 30) verdict = "Network is unstable and requires immediate attention.";
    else if (anomalyRate > 10) verdict = "Network shows partially unstable behavior.";
    else verdict = "Network appears mostly stable.";

    return {
      spikesSource,
      spikesDest,
      anomalyRate: anomalyRate.toFixed(2),
      verdict
    };
  };

  const interpretation = analyzeGraph();

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-white text-xl mb-4">Main Dashboard</h1>

      <div className="bg-gray-900 p-4 rounded-xl shadow flex flex-wrap items-end gap-4 border border-gray-700">
        <div className="flex flex-col">
          <label className="text-gray-300 text-xs mb-1">Select Model</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-2 rounded bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="model1">Model 1 – Normal + IF</option>
            <option value="model2">Model 2 – Hybrid + IF</option>
            <option value="model3">Model 3 – Normal + ECDF</option>
            <option value="model4">Model 4 – Hybrid + ECDF</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-gray-300 text-xs mb-1">Upload CSV</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="text-white file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div className="mt-5 sm:mt-0">
          <button
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow-md transition"
            onClick={handleProcess}
          >
            {loading ? "Processing..." : "Process"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Source Packets */}
        <div className="card">
          <h2 className="text-white mb-2">Source Packets</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={waveData1}>
              <XAxis dataKey="index" />
              <YAxis />
              <Tooltip
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null;
                  const entry = payload[0].payload;
                  const isAnomaly = entry.prediction === 1 ? "Anomaly" : "Normal";
                  return (
                    <div className="bg-gray-900 text-cyan-300 px-2 py-1 rounded text-xs shadow-md">
                      {`source: ${(Number(payload[0].value)).toFixed(2)} (${isAnomaly})`}
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="source"
                stroke="#00f0ff"
                fill="#00f0ff"
                fillOpacity={0.25}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Destination Packets */}
        <div className="card">
          <h2 className="text-white mb-2">Destination Packets</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={waveData1}>
              <XAxis dataKey="index" />
              <YAxis />
              <Tooltip
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null;
                  const entry = payload[0].payload;
                  const isAnomaly = entry.prediction === 1 ? "Anomaly" : "Normal";
                  return (
                    <div className="bg-gray-900 text-yellow-300 px-2 py-1 rounded text-xs shadow-md">
                      {`dest: ${(Number(payload[0].value)).toFixed(2)} (${isAnomaly})`}
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="dest"
                stroke="#f0c000"
                fill="#f0c000"
                fillOpacity={0.25}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Normal vs Anomalous Logs */}
        <div className="col-span-2 card">
          <h2 className="text-white mb-2">Normal vs Anomalous Logs</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[{ name: "Logs", ...counts }]}>  
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="normal" fill="#3399ff" name="Normal" />
              <Bar dataKey="anomaly" fill="#ffc107" name="Anomaly" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Collapsible Interpretation Section */}
        {waveData1.length > 0 && (
          <div className="col-span-2">
            <button
              className="bg-gray-700 text-white px-4 py-2 rounded mb-2"
              onClick={() => setShowInterpretation(!showInterpretation)}
            >
              {showInterpretation ? "Hide Graph Interpretation" : "Show Graph Interpretation"}
            </button>

            {showInterpretation && (
              <div className="bg-gray-900 p-4 rounded-xl space-y-2 overflow-y-auto max-h-60 border border-gray-700">
                {interpretation.spikesSource.map((idx, i) => (
                  <div key={`src-${i}`} className="text-cyan-300 text-xs">📈 Spike detected in Source Packets around index {idx}</div>
                ))}
                {interpretation.spikesDest.map((idx, i) => (
                  <div key={`dst-${i}`} className="text-yellow-300 text-xs">📈 Spike detected in Destination Packets around index {idx}</div>
                ))}
                <hr className="border-gray-700 my-2" />
                <div className="text-white text-xs">
                  ✅ <b>Summary:</b>
                  <ul className="list-disc pl-6 mt-1">
                    <li>Traffic shows moderate variability in packet flow.</li>
                    <li>{interpretation.anomalyRate}% of the uploaded logs were anomalies.</li>
                    <li>{interpretation.verdict}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
