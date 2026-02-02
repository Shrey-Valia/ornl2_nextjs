'use client';

import { TrendingUp, TrendingDown, Activity, Database } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { trainingData, errorDistribution } from '@/lib/mock-data';

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
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Model Performance</h1>
        <p className="text-gray-600">Monitor neural network evaluation and metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Predictions</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-3xl font-semibold text-gray-900 mb-1">156</div>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <span>+12%</span>
            <span className="text-gray-500">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Average Accuracy</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-semibold text-gray-900 mb-1">94.3%</div>
          <div className="w-16 h-16 rounded-full border-4 border-gray-200 relative mt-2">
            <div
              className="absolute inset-0 rounded-full border-4 border-blue-600"
              style={{
                clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)',
                transform: 'rotate(340deg)',
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Training Data Points</span>
            <Database className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-semibold text-gray-900 mb-1">45</div>
          <div className="text-sm text-gray-500">Batch reactor experiments</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Model Version</span>
            <TrendingUp className="w-4 h-4 text-gray-600" />
          </div>
          <div className="text-3xl font-semibold text-gray-900 mb-1">v2.1.3</div>
          <div className="text-sm text-gray-500">Released Jan 15, 2024</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Training vs Validation Loss</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trainingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="epoch"
                label={{ value: 'Epochs', position: 'insideBottom', offset: -5 }}
              />
              <YAxis label={{ value: 'Loss', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="training" stroke="#2563eb" strokeWidth={2} name="Training Loss" />
              <Line type="monotone" dataKey="validation" stroke="#f97316" strokeWidth={2} name="Validation Loss" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Prediction Error Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={errorDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Performance by Reactor Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceByType} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="type" />
              <Tooltip />
              <Bar dataKey="accuracy" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-amber-600 bg-amber-50 p-3 rounded">
            Flow reactor predictions not yet available
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Feature Importance Rankings</h3>
          <div className="space-y-4">
            {featureImportance.map((item) => (
              <div key={item.feature}>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-gray-700">{item.feature}</span>
                  <span
                    className={`font-medium ${
                      item.importance > 0.8
                        ? 'text-green-600'
                        : item.importance > 0.6
                        ? 'text-blue-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {(item.importance * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      item.importance > 0.8
                        ? 'bg-green-600'
                        : item.importance > 0.6
                        ? 'bg-blue-600'
                        : 'bg-gray-600'
                    }`}
                    style={{ width: `${item.importance * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Model Updates</h3>
        <div className="space-y-4">
          {[
            { version: 'v2.1.3', date: 'Jan 15, 2024', changes: 'Improved accuracy for high MW predictions' },
            { version: 'v2.1.2', date: 'Dec 28, 2023', changes: 'Bug fixes and performance improvements' },
            { version: 'v2.1.0', date: 'Dec 10, 2023', changes: 'Added support for new kinetic parameters' },
          ].map((update) => (
            <div key={update.version} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{update.version}</span>
                  <span className="text-sm text-gray-500">{update.date}</span>
                </div>
                <p className="text-sm text-gray-600">{update.changes}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}