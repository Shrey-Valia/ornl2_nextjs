'use client';

import { FileImage, FileText, FileSpreadsheet, FileJson, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { MWDChart } from '@/app/components/MWDChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useRef } from 'react';
import { chainLengthData, mwdChartData } from '@/lib/mock-data';
import { useSettings } from '@/app/context/SettingsContext';

const sensitivityData = [
  { param: 'Temp', low: 0.2, med: 0.5, high: 0.9 },
  { param: 'Monomer', low: 0.3, med: 0.6, high: 0.85 },
  { param: 'Time', low: 0.4, med: 0.7, high: 0.8 },
  { param: 'Initiator', low: 0.1, med: 0.3, high: 0.6 },
];

const resultsData = {
  experiment: 'Experiment #2024-156',
  runDate: 'January 20, 2024',
  modelVersion: 'v2.1.3',
  metrics: { r2Score: 0.943, mae: 0.032, confidence: 0.912, rmse: 0.045, maxError: 0.082, pearsonR: 0.971, samples: 45 },
  statistics: { meanMW: 45230, medianMW: 42150, stdDev: 12450 },
  model: { architecture: 'Feed-forward Neural Network', layers: '4 (128-64-32-1)', activation: 'ReLU / Sigmoid', trainingSamples: 45 }
};

export default function ResultsAnalysis() {
  const { settings } = useSettings();
  const dark = settings.darkMode;

  const bgCard = dark ? 'bg-gray-800' : 'bg-white';
  const borderColor = dark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = dark ? 'text-white' : 'text-gray-900';
  const textSecondary = dark ? 'text-gray-400' : 'text-gray-600';
  const textMuted = dark ? 'text-gray-500' : 'text-gray-500';
  const hoverBg = dark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const progressBg = dark ? 'bg-gray-700' : 'bg-gray-200';
  const gridStroke = dark ? '#374151' : '#e5e7eb';
  const axisColor = dark ? '#9ca3af' : '#6b7280';

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const toggleSection = (section: string) => setExpandedSection(expandedSection === section ? null : section);
  const showExportSuccess = (type: string) => { setExportStatus(type); setTimeout(() => setExportStatus(null), 2000); };

  const exportPNG = async () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800; canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = dark ? '#1f2937' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = dark ? '#ffffff' : '#111827';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillText('Molecular Weight Distribution', 50, 50);
      ctx.fillStyle = dark ? '#9ca3af' : '#6b7280';
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText(`${resultsData.experiment} - ${resultsData.runDate}`, 50, 80);
      ctx.strokeStyle = dark ? '#374151' : '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.strokeRect(50, 100, 700, 400);
      ctx.beginPath();
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      mwdChartData.forEach((point, i) => {
        const x = 50 + (i / mwdChartData.length) * 700;
        const y = 500 - point.predicted * 400;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.fillStyle = dark ? '#ffffff' : '#111827';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText('Metrics:', 50, 540);
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText(`R² Score: ${resultsData.metrics.r2Score}  |  MAE: ${resultsData.metrics.mae}  |  RMSE: ${resultsData.metrics.rmse}`, 50, 565);
      const link = document.createElement('a');
      link.download = `${resultsData.experiment.replace(/[^a-z0-9]/gi, '_')}_chart.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showExportSuccess('PNG');
    } catch (error) { console.error('PNG export error:', error); }
  };

  const exportPDF = () => {
    const printContent = `<!DOCTYPE html><html><head><title>${resultsData.experiment}</title><style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto;background:${dark ? '#1f2937' : '#fff'};color:${dark ? '#fff' : '#111'}}h1{border-bottom:2px solid #2563eb;padding-bottom:10px}h2{margin-top:30px}.metrics-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:15px;margin:20px 0}.metric{background:${dark ? '#374151' : '#f9fafb'};padding:15px;border-radius:8px}.metric-label{color:${dark ? '#9ca3af' : '#6b7280'};font-size:12px}.metric-value{font-size:18px;font-weight:bold}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid ${dark ? '#4b5563' : '#e5e7eb'};padding:10px;text-align:left}th{background:${dark ? '#374151' : '#f9fafb'}}.footer{margin-top:40px;padding-top:20px;border-top:1px solid ${dark ? '#4b5563' : '#e5e7eb'};color:${dark ? '#9ca3af' : '#6b7280'};font-size:12px}</style></head><body><h1>ORNL Neural Networks - Analysis Report</h1><div class="meta"><strong>${resultsData.experiment}</strong><br>Run Date: ${resultsData.runDate} | Model Version: ${resultsData.modelVersion}</div><h2>Performance Metrics</h2><div class="metrics-grid"><div class="metric"><div class="metric-label">R² Score</div><div class="metric-value">${resultsData.metrics.r2Score}</div></div><div class="metric"><div class="metric-label">Mean Absolute Error</div><div class="metric-value">${resultsData.metrics.mae}</div></div><div class="metric"><div class="metric-label">Prediction Confidence</div><div class="metric-value">${(resultsData.metrics.confidence * 100).toFixed(1)}%</div></div><div class="metric"><div class="metric-label">RMSE</div><div class="metric-value">${resultsData.metrics.rmse}</div></div></div><h2>Statistical Summary</h2><table><tr><th>Metric</th><th>Value</th></tr><tr><td>Mean MW</td><td>${resultsData.statistics.meanMW.toLocaleString()} g/mol</td></tr><tr><td>Median MW</td><td>${resultsData.statistics.medianMW.toLocaleString()} g/mol</td></tr><tr><td>Standard Deviation</td><td>${resultsData.statistics.stdDev.toLocaleString()} g/mol</td></tr></table><div class="footer">Generated by ORNL Neural Networks Platform<br>Export Date: ${new Date().toLocaleString()}</div></body></html>`;
    const printWindow = window.open('', '_blank');
    if (printWindow) { printWindow.document.write(printContent); printWindow.document.close(); printWindow.print(); showExportSuccess('PDF'); }
  };

  const exportCSV = () => {
    let csv = 'Molecular Weight (g/mol),Predicted,Experimental\n';
    mwdChartData.forEach(row => { csv += `${row.mw},${row.predicted},${row.experimental}\n`; });
    csv += '\n\nChain Length,Count\n';
    chainLengthData.forEach(row => { csv += `${row.length},${row.count}\n`; });
    csv += `\n\nMetrics\nR² Score,${resultsData.metrics.r2Score}\nMAE,${resultsData.metrics.mae}\nConfidence,${resultsData.metrics.confidence}\nRMSE,${resultsData.metrics.rmse}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${resultsData.experiment.replace(/[^a-z0-9]/gi, '_')}_data.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showExportSuccess('CSV');
  };

  const exportJSON = () => {
    const exportData = { experiment: resultsData.experiment, runDate: resultsData.runDate, modelVersion: resultsData.modelVersion, metrics: resultsData.metrics, statistics: resultsData.statistics, modelInfo: resultsData.model, mwdData: mwdChartData, chainLengthData, sensitivityAnalysis: sensitivityData, exportTimestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${resultsData.experiment.replace(/[^a-z0-9]/gi, '_')}_data.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showExportSuccess('JSON');
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-semibold mb-2 ${textPrimary}`}>Analysis Results - {resultsData.experiment}</h1>
          <p className={textSecondary}>Comprehensive analysis and comparison</p>
        </div>
        <div className={`text-right text-sm ${textSecondary}`}>
          <div>Run Date: {resultsData.runDate}</div>
          <div>Model Version: {resultsData.modelVersion}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div ref={chartRef}><MWDChart title="Molecular Weight Distribution Comparison" /></div>

        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <h3 className={`font-semibold mb-4 ${textPrimary}`}>Performance Metrics</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2"><span className={dark ? 'text-gray-300' : 'text-gray-700'}>R² Score</span><span className={`font-semibold ${textPrimary}`}>{resultsData.metrics.r2Score}</span></div>
              <div className={`w-full rounded-full h-3 ${progressBg}`}><div className="bg-green-500 h-3 rounded-full" style={{ width: `${resultsData.metrics.r2Score * 100}%` }} /></div>
            </div>
            <div>
              <div className="flex justify-between mb-2"><span className={dark ? 'text-gray-300' : 'text-gray-700'}>Mean Absolute Error</span><span className={`font-semibold ${textPrimary}`}>{resultsData.metrics.mae}</span></div>
              <div className={`w-full rounded-full h-3 ${progressBg}`}><div className="bg-blue-600 h-3 rounded-full" style={{ width: '96.8%' }} /></div>
            </div>
            <div>
              <div className="flex justify-between mb-2"><span className={dark ? 'text-gray-300' : 'text-gray-700'}>Prediction Confidence</span><span className={`font-semibold ${textPrimary}`}>{(resultsData.metrics.confidence * 100).toFixed(1)}%</span></div>
              <div className={`w-full rounded-full h-3 ${progressBg}`}><div className="bg-purple-600 h-3 rounded-full" style={{ width: `${resultsData.metrics.confidence * 100}%` }} /></div>
            </div>
            <div className={`pt-4 border-t grid grid-cols-2 gap-4 text-sm ${borderColor}`}>
              <div><div className={textSecondary}>RMSE</div><div className={`font-semibold ${textPrimary}`}>{resultsData.metrics.rmse}</div></div>
              <div><div className={textSecondary}>Max Error</div><div className={`font-semibold ${textPrimary}`}>{resultsData.metrics.maxError}</div></div>
              <div><div className={textSecondary}>Pearson r</div><div className={`font-semibold ${textPrimary}`}>{resultsData.metrics.pearsonR}</div></div>
              <div><div className={textSecondary}>Samples</div><div className={`font-semibold ${textPrimary}`}>{resultsData.metrics.samples}</div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <h3 className={`font-semibold mb-4 ${textPrimary}`}>Chain Length Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chainLengthData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="length" tick={{ fontSize: 12, fill: axisColor }} stroke={axisColor} />
              <YAxis tick={{ fontSize: 12, fill: axisColor }} stroke={axisColor} />
              <Tooltip contentStyle={{ backgroundColor: dark ? '#1f2937' : '#fff', borderColor: dark ? '#374151' : '#e5e7eb', color: dark ? '#fff' : '#111' }} />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <h3 className={`font-semibold mb-4 ${textPrimary}`}>Parameter Sensitivity Analysis</h3>
          <div className="space-y-3">
            {sensitivityData.map((item) => (
              <div key={item.param}>
                <div className={`text-sm mb-1 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{item.param}</div>
                <div className="flex gap-1">
                  <div className={`h-8 rounded-l ${dark ? 'bg-green-700' : 'bg-green-200'}`} style={{ width: `${item.low * 100}px` }} />
                  <div className={`h-8 ${dark ? 'bg-yellow-700' : 'bg-yellow-200'}`} style={{ width: `${item.med * 100}px` }} />
                  <div className={`h-8 rounded-r ${dark ? 'bg-red-700' : 'bg-red-200'}`} style={{ width: `${item.high * 100}px` }} />
                </div>
              </div>
            ))}
            <div className={`flex justify-between text-xs mt-2 ${textMuted}`}><span>Low</span><span>High Sensitivity</span></div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className={`${bgCard} rounded-lg border ${borderColor} overflow-hidden`}>
          <button onClick={() => toggleSection('stats')} className={`w-full px-6 py-4 flex items-center justify-between ${hoverBg}`}>
            <h3 className={`font-semibold ${textPrimary}`}>Statistical Summary</h3>
            {expandedSection === 'stats' ? <ChevronUp className={`w-5 h-5 ${textMuted}`} /> : <ChevronDown className={`w-5 h-5 ${textMuted}`} />}
          </button>
          {expandedSection === 'stats' && (
            <div className={`px-6 py-4 border-t ${borderColor}`}>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><div className={textSecondary}>Mean MW</div><div className={`font-medium ${textPrimary}`}>{resultsData.statistics.meanMW.toLocaleString()} g/mol</div></div>
                <div><div className={textSecondary}>Median MW</div><div className={`font-medium ${textPrimary}`}>{resultsData.statistics.medianMW.toLocaleString()} g/mol</div></div>
                <div><div className={textSecondary}>Std Dev</div><div className={`font-medium ${textPrimary}`}>{resultsData.statistics.stdDev.toLocaleString()} g/mol</div></div>
              </div>
            </div>
          )}
        </div>

        <div className={`${bgCard} rounded-lg border ${borderColor} overflow-hidden`}>
          <button onClick={() => toggleSection('model')} className={`w-full px-6 py-4 flex items-center justify-between ${hoverBg}`}>
            <h3 className={`font-semibold ${textPrimary}`}>Model Information</h3>
            {expandedSection === 'model' ? <ChevronUp className={`w-5 h-5 ${textMuted}`} /> : <ChevronDown className={`w-5 h-5 ${textMuted}`} />}
          </button>
          {expandedSection === 'model' && (
            <div className={`px-6 py-4 border-t ${borderColor}`}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className={textSecondary}>Architecture:</span><span className={`font-medium ${textPrimary}`}>{resultsData.model.architecture}</span></div>
                <div className="flex justify-between"><span className={textSecondary}>Layers:</span><span className={`font-medium ${textPrimary}`}>{resultsData.model.layers}</span></div>
                <div className="flex justify-between"><span className={textSecondary}>Activation:</span><span className={`font-medium ${textPrimary}`}>{resultsData.model.activation}</span></div>
                <div className="flex justify-between"><span className={textSecondary}>Training Samples:</span><span className={`font-medium ${textPrimary}`}>{resultsData.model.trainingSamples} batch experiments</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
        <h3 className={`font-semibold mb-4 ${textPrimary}`}>Export Options</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button onClick={exportPNG} className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-colors ${borderColor} ${hoverBg} hover:border-blue-500`}>
            {exportStatus === 'PNG' ? <Check className="w-4 h-4 text-green-500" /> : <FileImage className={`w-4 h-4 ${textSecondary}`} />}
            <span className={textPrimary}>{exportStatus === 'PNG' ? 'Downloaded!' : 'PNG'}</span>
          </button>
          <button onClick={exportPDF} className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-colors ${borderColor} ${hoverBg} hover:border-blue-500`}>
            {exportStatus === 'PDF' ? <Check className="w-4 h-4 text-green-500" /> : <FileText className={`w-4 h-4 ${textSecondary}`} />}
            <span className={textPrimary}>{exportStatus === 'PDF' ? 'Opened!' : 'PDF'}</span>
          </button>
          <button onClick={exportCSV} className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-colors ${borderColor} ${hoverBg} hover:border-blue-500`}>
            {exportStatus === 'CSV' ? <Check className="w-4 h-4 text-green-500" /> : <FileSpreadsheet className={`w-4 h-4 ${textSecondary}`} />}
            <span className={textPrimary}>{exportStatus === 'CSV' ? 'Downloaded!' : 'CSV'}</span>
          </button>
          <button onClick={exportJSON} className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-colors ${borderColor} ${hoverBg} hover:border-blue-500`}>
            {exportStatus === 'JSON' ? <Check className="w-4 h-4 text-green-500" /> : <FileJson className={`w-4 h-4 ${textSecondary}`} />}
            <span className={textPrimary}>{exportStatus === 'JSON' ? 'Downloaded!' : 'JSON'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}