import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ReferenceLine, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const storedMetrics = localStorage.getItem('modelMetrics');
    const storedData = localStorage.getItem('uploadedLogs');
    if (storedMetrics) setMetrics(JSON.parse(storedMetrics));
    if (storedData) setData(JSON.parse(storedData));
  }, []);

  const metricData = metrics ? [
    { metric: 'Accuracy', value: metrics.accuracy },
    { metric: 'Precision', value: metrics.precision },
    { metric: 'Recall', value: metrics.recall },
    { metric: 'F1 Score', value: metrics.f1_score },
    { metric: 'ROC AUC', value: metrics.roc_auc }
  ] : [];

  const summary = metrics ? `The model achieved an F1-score of ${(metrics.f1_score * 100).toFixed(2)}%. Recall was ${(metrics.recall * 100).toFixed(2)}%, and precision was ${(metrics.precision * 100).toFixed(2)}%.` : '';

  const ecdfData = metrics?.scores ? (() => {
    const sorted = [...metrics.scores].sort((a, b) => a - b);
    const n = sorted.length;
    const histogram: { [key: number]: number } = {};

    sorted.forEach(score => {
      const bin = Math.round(score * 1000) / 1000;
      histogram[bin] = (histogram[bin] || 0) + 1;
    });

    const histData = Object.entries(histogram).map(([bin, count]) => ({
      bin: Number(bin),
      count,
    })).sort((a, b) => a.bin - b.bin);

    const cumulativeData = sorted.map((score, i) => ({
      score,
      cumulative: (i + 1) / n,
    }));

    return { histData, cumulativeData };
  })() : { histData: [], cumulativeData: [] };

  const anomalyRate = metrics?.threshold && metrics?.scores ? (() => {
    const total = metrics.scores.length;
    const anomalies = metrics.scores.filter((s: number) => s < metrics.threshold).length;
    return (anomalies / total) * 100;
  })() : 0;

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;
    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map(row => Object.values(row).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "evaluation_data.csv";
    link.click();
  };

  return (
    <div className="p-6 space-y-8 text-center">
      <h1 className="text-white text-2xl mb-6">Performance Matrix</h1>

      {metrics ? (
        <>
          {/* Radar Chart + Table */}
          <div className="flex flex-col lg:flex-row gap-6 justify-center">
            <div className="bg-gray-900 p-4 rounded-xl flex-1">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart outerRadius={120} data={metricData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={30} domain={[0, 1]} />
                  <Tooltip />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#fcd34d"
                    fill="#facc15"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Metric Table */}
            <div className="bg-gray-800 text-white p-4 rounded-xl w-80 h-max self-center">
              <h2 className="text-lg font-bold mb-2">Metric Values</h2>
              <table className="text-sm w-full">
                <tbody>
                  {metricData.map((row, i) => (
                    <tr key={i} className="border-b border-gray-600">
                      <td className="p-2 font-medium text-left">{row.metric}</td>
                      <td className="p-2 text-right">{(row.value * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confusion Matrix */}
          <div className="bg-gray-800 text-white p-6 rounded-xl w-max mx-auto space-y-4">
            <h2 className="text-xl font-bold">Confusion Matrix</h2>
            {metrics.confusion_matrix && (
              <table className="border border-white text-base">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="p-4 border border-white"></th>
                    <th className="p-4 border border-white">Predicted: Normal</th>
                    <th className="p-4 border border-white">Predicted: Anomaly</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-700">
                    <td className="p-4 border border-white font-medium">Actual: Normal</td>
                    <td className="p-4 border border-white">{metrics.confusion_matrix[0]}</td>
                    <td className="p-4 border border-white">{metrics.confusion_matrix[1]}</td>
                  </tr>
                  <tr className="bg-gray-700">
                    <td className="p-4 border border-white font-medium">Actual: Anomaly</td>
                    <td className="p-4 border border-white">{metrics.confusion_matrix[2]}</td>
                    <td className="p-4 border border-white">{metrics.confusion_matrix[3]}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Score Histogram and ECDF */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Histogram */}
            <div className="card bg-gray-900 rounded-xl p-4 flex-1">
              <h2 className="text-white text-lg mb-4">Training Score Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={ecdfData.histData}>
                  <XAxis dataKey="bin" type="number" domain={['auto', 'auto']} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#60a5fa" name="Score Count" />
                  {metrics.threshold && (
                    <ReferenceLine
                      x={metrics.threshold}
                      stroke="red"
                      strokeDasharray="3 3"
                      label={{ value: "Threshold ➝", position: "top", fill: "red", fontSize: 12 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* ECDF */}
            <div className="card bg-gray-900 rounded-xl p-4 flex-1">
              <h2 className="text-white text-lg mb-4">ECDF Curve</h2>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={ecdfData.cumulativeData}>
                  <XAxis dataKey="score" type="number" domain={['auto', 'auto']} />
                  <YAxis domain={[0, 1]} />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="cumulative" stroke="#f97316" name="ECDF" dot={false} />
                  {metrics.threshold && (
                    <ReferenceLine
                      x={metrics.threshold}
                      stroke="red"
                      strokeDasharray="3 3"
                      label={{ value: "Threshold ➝", position: "top", fill: "red", fontSize: 12 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Threshold Interpretation */}
          <div className="bg-gray-800 text-gray-300 p-4 rounded-xl mt-4">
            <p>Threshold applied: <span className="text-white font-bold">{metrics.threshold?.toFixed(4)}</span></p>
            <p>{anomalyRate.toFixed(2)}% of points classified as anomalies, {(100 - anomalyRate).toFixed(2)}% classified as normal.</p>
          </div>

          {/* Text Summary */}
          <p className="text-sm text-gray-400 mt-4">{summary}</p>

          {/* Row-wise Prediction Breakdown */}
          <div className="bg-gray-900 p-4 rounded-xl overflow-x-auto">
            <h2 className="text-white mb-2">Prediction Breakdown</h2>
            <table className="min-w-full text-xs text-white text-center border border-white">
              <thead className="bg-gray-700 text-xs">
                <tr>
                  <th>#</th>
                  <th>Actual</th>
                  <th>Predicted</th>
                  <th>Correct?</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 50).map((row, i) => {
                  const actual = row.label;
                  const predicted = row.prediction === 1 ? 1 : 0;
                  const correct = actual === predicted;
                  return (
                    <tr key={i} className={correct ? "bg-green-900" : "bg-red-900"}>
                      <td>{i + 1}</td>
                      <td>{actual}</td>
                      <td>{predicted}</td>
                      <td>{correct ? "✔" : "✘"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded"
          >
            Download CSV
          </button>

        </>
      ) : (
        <p className="text-gray-400">No metrics available. Please upload a CSV first.</p>
      )}
    </div>
  );
}
