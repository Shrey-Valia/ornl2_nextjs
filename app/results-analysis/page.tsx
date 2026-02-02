'use client';

import { FileImage, FileText, FileSpreadsheet, FileJson, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { MWDChart } from '@/app/components/MWDChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useRef } from 'react';
import { chainLengthData, mwdChartData } from '@/lib/mock-data';

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
  metrics: {
    r2Score: 0.943,
    mae: 0.032,
    confidence: 0.912,
    rmse: 0.045,
    maxError: 0.082,
    pearsonR: 0.971,
    samples: 45
  },
  statistics: {
    meanMW: 45230,
    medianMW: 42150,
    stdDev: 12450
  },
  model: {
    architecture: 'Feed-forward Neural Network',
    layers: '4 (128-64-32-1)',
    activation: 'ReLU / Sigmoid',
    trainingSamples: 45
  }
};

export default function ResultsAnalysis() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const showExportSuccess = (type: string) => {
    setExportStatus(type);
    setTimeout(() => setExportStatus(null), 2000);
  };

  // Export as PNG
  const exportPNG = async () => {
    try {
      const chartElement = chartRef.current;
      if (!chartElement) return;

      // Use html2canvas approach via canvas
      const svg = chartElement.querySelector('svg');
      if (!svg) {
        // Fallback: create a simple canvas with the data visualization
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw title
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.fillText('Molecular Weight Distribution', 50, 50);

        // Draw subtitle
        ctx.fillStyle = '#6b7280';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(`${resultsData.experiment} - ${resultsData.runDate}`, 50, 80);

        // Draw chart area
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.strokeRect(50, 100, 700, 400);

        // Draw data points
        ctx.beginPath();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        mwdChartData.forEach((point, i) => {
          const x = 50 + (i / mwdChartData.length) * 700;
          const y = 500 - point.predicted * 400;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw metrics
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillText('Metrics:', 50, 540);
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(`R² Score: ${resultsData.metrics.r2Score}  |  MAE: ${resultsData.metrics.mae}  |  RMSE: ${resultsData.metrics.rmse}`, 50, 565);

        // Download
        const link = document.createElement('a');
        link.download = `${resultsData.experiment.replace(/[^a-z0-9]/gi, '_')}_chart.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showExportSuccess('PNG');
        return;
      }

      // If SVG exists, convert it
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = 800;
      canvas.height = 500;
      
      img.onload = () => {
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const link = document.createElement('a');
          link.download = `${resultsData.experiment.replace(/[^a-z0-9]/gi, '_')}_chart.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          showExportSuccess('PNG');
        }
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (error) {
      console.error('PNG export error:', error);
    }
  };

  // Export as PDF (creates a printable HTML that opens print dialog)
  const exportPDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${resultsData.experiment} - Analysis Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #111827; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          .meta { color: #6b7280; margin-bottom: 20px; }
          .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
          .metric { background: #f9fafb; padding: 15px; border-radius: 8px; }
          .metric-label { color: #6b7280; font-size: 12px; }
          .metric-value { color: #111827; font-size: 18px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
          th { background: #f9fafb; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>ORNL Neural Networks - Analysis Report</h1>
        <div class="meta">
          <strong>${resultsData.experiment}</strong><br>
          Run Date: ${resultsData.runDate} | Model Version: ${resultsData.modelVersion}
        </div>
        
        <h2>Performance Metrics</h2>
        <div class="metrics-grid">
          <div class="metric">
            <div class="metric-label">R² Score</div>
            <div class="metric-value">${resultsData.metrics.r2Score}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Mean Absolute Error</div>
            <div class="metric-value">${resultsData.metrics.mae}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Prediction Confidence</div>
            <div class="metric-value">${(resultsData.metrics.confidence * 100).toFixed(1)}%</div>
          </div>
          <div class="metric">
            <div class="metric-label">RMSE</div>
            <div class="metric-value">${resultsData.metrics.rmse}</div>
          </div>
        </div>

        <h2>Statistical Summary</h2>
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Mean MW</td><td>${resultsData.statistics.meanMW.toLocaleString()} g/mol</td></tr>
          <tr><td>Median MW</td><td>${resultsData.statistics.medianMW.toLocaleString()} g/mol</td></tr>
          <tr><td>Standard Deviation</td><td>${resultsData.statistics.stdDev.toLocaleString()} g/mol</td></tr>
        </table>

        <h2>Model Information</h2>
        <table>
          <tr><th>Property</th><th>Value</th></tr>
          <tr><td>Architecture</td><td>${resultsData.model.architecture}</td></tr>
          <tr><td>Layers</td><td>${resultsData.model.layers}</td></tr>
          <tr><td>Activation</td><td>${resultsData.model.activation}</td></tr>
          <tr><td>Training Samples</td><td>${resultsData.model.trainingSamples} batch experiments</td></tr>
        </table>

        <h2>MWD Data Points (Sample)</h2>
        <table>
          <tr><th>Molecular Weight (g/mol)</th><th>Predicted</th><th>Experimental</th></tr>
          ${mwdChartData.slice(0, 10).map(d => `<tr><td>${d.mw.toLocaleString()}</td><td>${d.predicted}</td><td>${d.experimental}</td></tr>`).join('')}
        </table>

        <div class="footer">
          Generated by ORNL Neural Networks Platform<br>
          Export Date: ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      showExportSuccess('PDF');
    }
  };

  // Export as CSV
  const exportCSV = () => {
    // Prepare MWD data
    let csv = 'Molecular Weight (g/mol),Predicted,Experimental\n';
    mwdChartData.forEach(row => {
      csv += `${row.mw},${row.predicted},${row.experimental}\n`;
    });

    csv += '\n\nChain Length,Count\n';
    chainLengthData.forEach(row => {
      csv += `${row.length},${row.count}\n`;
    });

    csv += '\n\nMetrics\n';
    csv += `R² Score,${resultsData.metrics.r2Score}\n`;
    csv += `MAE,${resultsData.metrics.mae}\n`;
    csv += `Confidence,${resultsData.metrics.confidence}\n`;
    csv += `RMSE,${resultsData.metrics.rmse}\n`;
    csv += `Max Error,${resultsData.metrics.maxError}\n`;
    csv += `Pearson r,${resultsData.metrics.pearsonR}\n`;
    csv += `Samples,${resultsData.metrics.samples}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${resultsData.experiment.replace(/[^a-z0-9]/gi, '_')}_data.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showExportSuccess('CSV');
  };

  // Export as JSON
  const exportJSON = () => {
    const exportData = {
      experiment: resultsData.experiment,
      runDate: resultsData.runDate,
      modelVersion: resultsData.modelVersion,
      metrics: resultsData.metrics,
      statistics: resultsData.statistics,
      modelInfo: resultsData.model,
      mwdData: mwdChartData,
      chainLengthData: chainLengthData,
      sensitivityAnalysis: sensitivityData,
      exportTimestamp: new Date().toISOString()
    };

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
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Analysis Results - {resultsData.experiment}
          </h1>
          <p className="text-gray-600">Comprehensive analysis and comparison</p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <div>Run Date: {resultsData.runDate}</div>
          <div>Model Version: {resultsData.modelVersion}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div ref={chartRef}>
          <MWDChart title="Molecular Weight Distribution Comparison" />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">R² Score</span>
                <span className="font-semibold text-gray-900">{resultsData.metrics.r2Score}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-green-600 h-3 rounded-full" style={{ width: `${resultsData.metrics.r2Score * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Mean Absolute Error</span>
                <span className="font-semibold text-gray-900">{resultsData.metrics.mae}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full" style={{ width: '96.8%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Prediction Confidence</span>
                <span className="font-semibold text-gray-900">{(resultsData.metrics.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-purple-600 h-3 rounded-full" style={{ width: `${resultsData.metrics.confidence * 100}%` }} />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">RMSE</div>
                <div className="font-semibold text-gray-900">{resultsData.metrics.rmse}</div>
              </div>
              <div>
                <div className="text-gray-600">Max Error</div>
                <div className="font-semibold text-gray-900">{resultsData.metrics.maxError}</div>
              </div>
              <div>
                <div className="text-gray-600">Pearson r</div>
                <div className="font-semibold text-gray-900">{resultsData.metrics.pearsonR}</div>
              </div>
              <div>
                <div className="text-gray-600">Samples</div>
                <div className="font-semibold text-gray-900">{resultsData.metrics.samples}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Chain Length Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chainLengthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="length" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Parameter Sensitivity Analysis</h3>
          <div className="space-y-3">
            {sensitivityData.map((item) => (
              <div key={item.param}>
                <div className="text-sm text-gray-700 mb-1">{item.param}</div>
                <div className="flex gap-1">
                  <div className="h-8 bg-green-200 rounded-l" style={{ width: `${item.low * 100}px` }} />
                  <div className="h-8 bg-yellow-200" style={{ width: `${item.med * 100}px` }} />
                  <div className="h-8 bg-red-200 rounded-r" style={{ width: `${item.high * 100}px` }} />
                </div>
              </div>
            ))}
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Low</span>
              <span>High Sensitivity</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button onClick={() => toggleSection('stats')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50">
            <h3 className="font-semibold text-gray-900">Statistical Summary</h3>
            {expandedSection === 'stats' ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
          </button>
          {expandedSection === 'stats' && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Mean MW</div>
                  <div className="font-medium">{resultsData.statistics.meanMW.toLocaleString()} g/mol</div>
                </div>
                <div>
                  <div className="text-gray-600">Median MW</div>
                  <div className="font-medium">{resultsData.statistics.medianMW.toLocaleString()} g/mol</div>
                </div>
                <div>
                  <div className="text-gray-600">Std Dev</div>
                  <div className="font-medium">{resultsData.statistics.stdDev.toLocaleString()} g/mol</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button onClick={() => toggleSection('model')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50">
            <h3 className="font-semibold text-gray-900">Model Information</h3>
            {expandedSection === 'model' ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
          </button>
          {expandedSection === 'model' && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Architecture:</span>
                  <span className="font-medium">{resultsData.model.architecture}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Layers:</span>
                  <span className="font-medium">{resultsData.model.layers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Activation:</span>
                  <span className="font-medium">{resultsData.model.activation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Training Samples:</span>
                  <span className="font-medium">{resultsData.model.trainingSamples} batch experiments</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Export Options</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={exportPNG}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-colors"
          >
            {exportStatus === 'PNG' ? <Check className="w-4 h-4 text-green-600" /> : <FileImage className="w-4 h-4 text-gray-600" />}
            <span>{exportStatus === 'PNG' ? 'Downloaded!' : 'PNG'}</span>
          </button>
          <button 
            onClick={exportPDF}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-colors"
          >
            {exportStatus === 'PDF' ? <Check className="w-4 h-4 text-green-600" /> : <FileText className="w-4 h-4 text-gray-600" />}
            <span>{exportStatus === 'PDF' ? 'Opened!' : 'PDF'}</span>
          </button>
          <button 
            onClick={exportCSV}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-colors"
          >
            {exportStatus === 'CSV' ? <Check className="w-4 h-4 text-green-600" /> : <FileSpreadsheet className="w-4 h-4 text-gray-600" />}
            <span>{exportStatus === 'CSV' ? 'Downloaded!' : 'CSV'}</span>
          </button>
          <button 
            onClick={exportJSON}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-colors"
          >
            {exportStatus === 'JSON' ? <Check className="w-4 h-4 text-green-600" /> : <FileJson className="w-4 h-4 text-gray-600" />}
            <span>{exportStatus === 'JSON' ? 'Downloaded!' : 'JSON'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}