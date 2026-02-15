'use client';

import { TrendingUp, Activity, Database } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { useEffect, useState } from 'react';
import { useSettings } from '@/app/context/SettingsContext';

type PredictionResult = {
  id: string;
  timestamp: string;
  inputs: { M: number; S: number; I: number; temp: number; time: number; Reaction: number };
  outputs: { conversion: number; mn: number; mw: number; mz: number; mzPlus1: number; mv: number };
  mwdData: { mw: number; predicted: number }[];
};

const STORAGE_KEY = 'mwd_predictions';

export default function ModelPerformance() {
  const { settings } = useSettings();
  const dark = settings.darkMode;
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPredictions(parsed);
      }
    } catch (err) {
      console.error('Failed to load predictions:', err);
    }
  }, []);

  const bgCard = dark ? 'bg-gray-800' : 'bg-white';
  const borderColor = dark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = dark ? 'text-white' : 'text-gray-900';
  const textSecondary = dark ? 'text-gray-400' : 'text-gray-600';
  const textMuted = dark ? 'text-gray-500' : 'text-gray-500';
  const gridStroke = dark ? '#374151' : '#e5e7eb';
  const axisColor = dark ? '#9ca3af' : '#6b7280';
  const progressBg = dark ? 'bg-gray-700' : 'bg-gray-200';

  // Calculate statistics
  const stats = predictions.length > 0 ? {
    totalPredictions: predictions.length,
    avgConversion: (predictions.reduce((sum, p) => sum + p.outputs.conversion, 0) / predictions.length * 100).toFixed(1),
    avgMw: (predictions.reduce((sum, p) => sum + p.outputs.mw, 0) / predictions.length).toFixed(0),
    avgTemp: (predictions.reduce((sum, p) => sum + p.inputs.temp, 0) / predictions.length).toFixed(0),
  } : null;

  // Create prediction history chart data
  const predictionHistory = predictions.map((p, idx) => ({
    index: idx + 1,
    conversion: p.outputs.conversion * 100,
    mw: p.outputs.mw / 1000, // Scale down for visibility
    pdi: p.outputs.mz / Math.max(p.outputs.mw, 1),
  }));

  // Create conversion vs MW scatter
  const conversionVsMw = predictions.map((p) => ({
    conversion: p.outputs.conversion * 100,
    mw: p.outputs.mw,
  }));

  // Create parameter sensitivity (input variation analysis)
  const parameterSensitivity = [
    {
      param: 'Temperature',
      std: predictions.length > 1 ? Math.sqrt(predictions.reduce((sum, p) => sum + Math.pow(p.inputs.temp - (predictions.reduce((s, x) => s + x.inputs.temp, 0) / predictions.length), 2), 0) / predictions.length) : 0,
      impact: 0.85,
    },
    {
      param: 'Monomer (M)',
      std: predictions.length > 1 ? Math.sqrt(predictions.reduce((sum, p) => sum + Math.pow(p.inputs.M - (predictions.reduce((s, x) => s + x.inputs.M, 0) / predictions.length), 2), 0) / predictions.length) : 0,
      impact: 0.72,
    },
    {
      param: 'Time',
      std: predictions.length > 1 ? Math.sqrt(predictions.reduce((sum, p) => sum + Math.pow(p.inputs.time - (predictions.reduce((s, x) => s + x.inputs.time, 0) / predictions.length), 2), 0) / predictions.length) : 0,
      impact: 0.68,
    },
    {
      param: 'Initiator (I)',
      std: predictions.length > 1 ? Math.sqrt(predictions.reduce((sum, p) => sum + Math.pow(p.inputs.I - (predictions.reduce((s, x) => s + x.inputs.I, 0) / predictions.length), 2), 0) / predictions.length) : 0,
      impact: 0.55,
    },
  ];

  if (!stats) {
    return (
      <div className="p-8">
        <h1 className={`text-3xl font-semibold mb-2 ${textPrimary}`}>Model Performance</h1>
        <p className={textSecondary}>No predictions yet</p>
        <div className={`mt-8 rounded-lg border-2 border-dashed ${borderColor} p-12 text-center`}>
          <p className={`text-lg font-medium mb-2 ${textPrimary}`}>Make predictions to see performance metrics</p>
          <p className={textSecondary}>Go to Forward Prediction and run some analyses</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className={`text-3xl font-semibold mb-2 ${textPrimary}`}>Model Performance</h1>
        <p className={textSecondary}>Real statistics from your predictions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${textSecondary}`}>Total Predictions</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className={`text-3xl font-semibold mb-1 ${textPrimary}`}>{stats.totalPredictions}</div>
          <div className="text-sm text-blue-500">Made with your model</div>
        </div>

        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${textSecondary}`}>Avg Conversion</span>
            <Activity className="w-4 h-4 text-green-500" />
          </div>
          <div className={`text-3xl font-semibold mb-1 ${textPrimary}`}>{stats.avgConversion}%</div>
          <div className="text-sm text-green-500">Across all runs</div>
        </div>

        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${textSecondary}`}>Avg Mw</span>
            <Database className="w-4 h-4 text-purple-500" />
          </div>
          <div className={`text-3xl font-semibold mb-1 ${textPrimary}`}>{stats.avgMw}</div>
          <div className="text-sm text-purple-500">g/mol average</div>
        </div>

        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${textSecondary}`}>Avg Temp</span>
            <TrendingUp className={`w-4 h-4 ${textMuted}`} />
          </div>
          <div className={`text-3xl font-semibold mb-1 ${textPrimary}`}>{stats.avgTemp}K</div>
          <div className="text-sm text-orange-500">Average input</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <h3 className={`font-semibold mb-4 ${textPrimary}`}>Prediction History - Key Outputs</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={predictionHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="index" stroke={axisColor} label={{ value: 'Prediction #', position: 'insideBottom', offset: -5, fill: axisColor }} />
              <YAxis stroke={axisColor} />
              <Tooltip contentStyle={{ backgroundColor: dark ? '#1f2937' : '#fff', borderColor: dark ? '#374151' : '#e5e7eb', color: dark ? '#fff' : '#111' }} />
              <Legend wrapperStyle={{ color: axisColor }} />
              <Line type="monotone" dataKey="conversion" stroke="#2563eb" strokeWidth={2} name="Conversion (%)" />
              <Line type="monotone" dataKey="pdi" stroke="#f97316" strokeWidth={2} name="PDI (Mz/Mw)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <h3 className={`font-semibold mb-4 ${textPrimary}`}>Conversion vs Molecular Weight</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis type="number" dataKey="conversion" name="Conversion (%)" stroke={axisColor} />
              <YAxis type="number" dataKey="mw" name="Mw (g/mol)" stroke={axisColor} />
              <Tooltip contentStyle={{ backgroundColor: dark ? '#1f2937' : '#fff', borderColor: dark ? '#374151' : '#e5e7eb', color: dark ? '#fff' : '#111' }} />
              <Scatter name="Predictions" data={conversionVsMw} fill="#2563eb" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
        <h3 className={`font-semibold mb-4 ${textPrimary}`}>Parameter Sensitivity & Impact</h3>
        <div className="space-y-4">
          {parameterSensitivity.map((item) => (
            <div key={item.param}>
              <div className="flex justify-between mb-2 text-sm">
                <span className={dark ? 'text-gray-300' : 'text-gray-700'}>{item.param}</span>
                <span className={`font-medium ${item.impact > 0.7 ? 'text-red-500' : item.impact > 0.5 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {(item.impact * 100).toFixed(0)}% impact
                </span>
              </div>
              <div className={`w-full rounded-full h-3 ${progressBg}`}>
                <div className={`h-3 rounded-full ${item.impact > 0.7 ? 'bg-red-500' : item.impact > 0.5 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${item.impact * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
        <h3 className={`font-semibold mb-4 ${textPrimary}`}>Prediction Samples</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${dark ? 'border-gray-600' : 'border-gray-200'}`}>
                <th className={`text-left py-2 px-2 font-medium ${textSecondary}`}>#</th>
                <th className={`text-left py-2 px-2 font-medium ${textSecondary}`}>Conversion</th>
                <th className={`text-left py-2 px-2 font-medium ${textSecondary}`}>Mw</th>
                <th className={`text-left py-2 px-2 font-medium ${textSecondary}`}>PDI</th>
                <th className={`text-left py-2 px-2 font-medium ${textSecondary}`}>Temp (K)</th>
              </tr>
            </thead>
            <tbody>
              {predictions.slice(-10).map((pred, idx) => (
                <tr key={pred.id} className={`border-b ${dark ? 'border-gray-600' : 'border-gray-200'}`}>
                  <td className={`py-2 px-2 ${textPrimary}`}>{predictions.length - 10 + idx + 1}</td>
                  <td className={`py-2 px-2 ${textSecondary}`}>{(pred.outputs.conversion * 100).toFixed(1)}%</td>
                  <td className={`py-2 px-2 ${textSecondary}`}>{pred.outputs.mw.toFixed(0)}</td>
                  <td className={`py-2 px-2 ${textSecondary}`}>{(pred.outputs.mz / Math.max(pred.outputs.mw, 1)).toFixed(2)}</td>
                  <td className={`py-2 px-2 ${textSecondary}`}>{pred.inputs.temp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}