'use client';

import { TrendingUp, Activity, Database } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { trainingData, errorDistribution } from '@/lib/mock-data';
import { useSettings } from '@/app/context/SettingsContext';

const performanceByType = [
  { type: 'Batch', accuracy: 94 },
  { type: 'Flow', accuracy: 0 },
];

const featureImportance = [
  { feature: 'Temperature', importance: 0.92 },
  { feature: 'Monomer Conc.', importance: 0.85 },
  { feature: 'Reaction Time', importance: 0.78 },
  { feature: 'Initiator Conc.', importance: 0.65 },
  { feature: 'Propagation Rate', importance: 0.52 },
];

export default function ModelPerformance() {
  const { settings } = useSettings();
  const dark = settings.darkMode;

  const bgCard = dark ? 'bg-gray-800' : 'bg-white';
  const borderColor = dark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = dark ? 'text-white' : 'text-gray-900';
  const textSecondary = dark ? 'text-gray-400' : 'text-gray-600';
  const textMuted = dark ? 'text-gray-500' : 'text-gray-500';
  const gridStroke = dark ? '#374151' : '#e5e7eb';
  const axisColor = dark ? '#9ca3af' : '#6b7280';
  const progressBg = dark ? 'bg-gray-700' : 'bg-gray-200';

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className={`text-3xl font-semibold mb-2 ${textPrimary}`}>Model Performance</h1>
        <p className={textSecondary}>Monitor neural network evaluation and metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${textSecondary}`}>Total Predictions</span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className={`text-3xl font-semibold mb-1 ${textPrimary}`}>156</div>
          <div className="flex items-center gap-1 text-sm text-green-500">
            <span>+12%</span>
            <span className={textMuted}>vs last month</span>
          </div>
        </div>

        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${textSecondary}`}>Average Accuracy</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className={`text-3xl font-semibold mb-1 ${textPrimary}`}>94.3%</div>
          <div className={`w-16 h-16 rounded-full border-4 relative mt-2 ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)', transform: 'rotate(340deg)' }} />
          </div>
        </div>

        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${textSecondary}`}>Training Data Points</span>
            <Database className="w-4 h-4 text-purple-500" />
          </div>
          <div className={`text-3xl font-semibold mb-1 ${textPrimary}`}>45</div>
          <div className={`text-sm ${textMuted}`}>Batch reactor experiments</div>
        </div>

        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${textSecondary}`}>Model Version</span>
            <TrendingUp className={`w-4 h-4 ${textMuted}`} />
          </div>
          <div className={`text-3xl font-semibold mb-1 ${textPrimary}`}>v2.1.3</div>
          <div className={`text-sm ${textMuted}`}>Released Jan 15, 2024</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <h3 className={`font-semibold mb-4 ${textPrimary}`}>Training vs Validation Loss</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trainingData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="epoch" stroke={axisColor} label={{ value: 'Epochs', position: 'insideBottom', offset: -5, fill: axisColor }} />
              <YAxis stroke={axisColor} label={{ value: 'Loss', angle: -90, position: 'insideLeft', fill: axisColor }} />
              <Tooltip contentStyle={{ backgroundColor: dark ? '#1f2937' : '#fff', borderColor: dark ? '#374151' : '#e5e7eb', color: dark ? '#fff' : '#111' }} />
              <Legend wrapperStyle={{ color: axisColor }} />
              <Line type="monotone" dataKey="training" stroke="#2563eb" strokeWidth={2} name="Training Loss" />
              <Line type="monotone" dataKey="validation" stroke="#f97316" strokeWidth={2} name="Validation Loss" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <h3 className={`font-semibold mb-4 ${textPrimary}`}>Prediction Error Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={errorDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: axisColor }} stroke={axisColor} />
              <YAxis tick={{ fontSize: 12, fill: axisColor }} stroke={axisColor} />
              <Tooltip contentStyle={{ backgroundColor: dark ? '#1f2937' : '#fff', borderColor: dark ? '#374151' : '#e5e7eb', color: dark ? '#fff' : '#111' }} />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <h3 className={`font-semibold mb-4 ${textPrimary}`}>Performance by Reactor Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceByType} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis type="number" domain={[0, 100]} stroke={axisColor} tick={{ fill: axisColor }} />
              <YAxis type="category" dataKey="type" stroke={axisColor} tick={{ fill: axisColor }} />
              <Tooltip contentStyle={{ backgroundColor: dark ? '#1f2937' : '#fff', borderColor: dark ? '#374151' : '#e5e7eb', color: dark ? '#fff' : '#111' }} />
              <Bar dataKey="accuracy" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className={`mt-4 text-sm p-3 rounded ${dark ? 'text-amber-400 bg-amber-900/30' : 'text-amber-600 bg-amber-50'}`}>
            Flow reactor predictions not yet available
          </div>
        </div>

        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <h3 className={`font-semibold mb-4 ${textPrimary}`}>Feature Importance Rankings</h3>
          <div className="space-y-4">
            {featureImportance.map((item) => (
              <div key={item.feature}>
                <div className="flex justify-between mb-2 text-sm">
                  <span className={dark ? 'text-gray-300' : 'text-gray-700'}>{item.feature}</span>
                  <span className={`font-medium ${item.importance > 0.8 ? 'text-green-500' : item.importance > 0.6 ? 'text-blue-500' : textMuted}`}>
                    {(item.importance * 100).toFixed(0)}%
                  </span>
                </div>
                <div className={`w-full rounded-full h-3 ${progressBg}`}>
                  <div className={`h-3 rounded-full ${item.importance > 0.8 ? 'bg-green-500' : item.importance > 0.6 ? 'bg-blue-500' : 'bg-gray-500'}`} style={{ width: `${item.importance * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
        <h3 className={`font-semibold mb-4 ${textPrimary}`}>Recent Model Updates</h3>
        <div className="space-y-4">
          {[
            { version: 'v2.1.3', date: 'Jan 15, 2024', changes: 'Improved accuracy for high MW predictions' },
            { version: 'v2.1.2', date: 'Dec 28, 2023', changes: 'Bug fixes and performance improvements' },
            { version: 'v2.1.0', date: 'Dec 10, 2023', changes: 'Added support for new kinetic parameters' },
          ].map((update) => (
            <div key={update.version} className={`flex gap-4 pb-4 border-b last:border-0 ${borderColor}`}>
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium ${textPrimary}`}>{update.version}</span>
                  <span className={`text-sm ${textMuted}`}>{update.date}</span>
                </div>
                <p className={`text-sm ${textSecondary}`}>{update.changes}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}