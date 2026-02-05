'use client';

import Link from 'next/link';
import { TrendingUp, Database, Activity, Upload, Play, Eye } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { recentPredictions, predictionData } from '@/lib/mock-data';
import { useSettings } from '@/app/context/SettingsContext';

export default function Dashboard() {
  const { settings } = useSettings();
  const dark = settings.darkMode;

  const bgCard = dark ? 'bg-gray-800' : 'bg-white';
  const borderColor = dark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = dark ? 'text-white' : 'text-gray-900';
  const textSecondary = dark ? 'text-gray-400' : 'text-gray-600';
  const progressBg = dark ? 'bg-gray-700' : 'bg-gray-200';
  const gridStroke = dark ? '#374151' : '#e5e7eb';
  const axisColor = dark ? '#9ca3af' : '#6b7280';

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className={`text-3xl font-semibold mb-2 ${textPrimary}`}>
          ORNL Neural Networks in Polymer Growth
        </h1>
        <p className={textSecondary}>
          Welcome back! Here&apos;s an overview of your neural network analysis system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-sm ${textSecondary}`}>Recent Predictions</p>
              <p className={`text-2xl font-semibold mt-1 ${textPrimary}`}>156</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${dark ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={recentPredictions}>
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-sm ${textSecondary}`}>Model Accuracy</p>
              <p className={`text-2xl font-semibold mt-1 ${textPrimary}`}>94.3%</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${dark ? 'bg-green-900/50' : 'bg-green-100'}`}>
              <Activity className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className={textSecondary}>R² Score</span>
              <span className={`font-medium ${textPrimary}`}>0.943</span>
            </div>
            <div className={`w-full rounded-full h-2 ${progressBg}`}>
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '94.3%' }}></div>
            </div>
          </div>
        </div>

        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-sm ${textSecondary}`}>Total Experiments</p>
              <p className={`text-2xl font-semibold mt-1 ${textPrimary}`}>45</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${dark ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
              <Database className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={textSecondary}>Batch Reactor</span>
              <span className={`font-medium ${textPrimary}`}>45</span>
            </div>
            <div className="flex justify-between">
              <span className={textSecondary}>Flow Reactor</span>
              <span className="text-amber-500 font-medium">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Dataset Status</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className={`text-sm ${textSecondary}`}>Batch Reactor</span>
                <span className={`text-sm font-medium ${textPrimary}`}>45 experiments</span>
              </div>
              <div className={`w-full rounded-full h-2 ${progressBg}`}>
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className={`text-sm ${textSecondary}`}>Flow Reactor</span>
                <span className="text-sm font-medium text-amber-500">Coming Soon</span>
              </div>
              <div className={`w-full rounded-full h-2 ${progressBg}`}>
                <div className="bg-amber-400 h-2 rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Model Performance Metrics</h2>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={predictionData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: axisColor }} stroke={axisColor} />
              <YAxis tick={{ fontSize: 12, fill: axisColor }} stroke={axisColor} />
              <Tooltip contentStyle={{ backgroundColor: dark ? '#1f2937' : '#fff', borderColor: dark ? '#374151' : '#e5e7eb', color: dark ? '#fff' : '#111' }} />
              <Bar dataKey="predictions" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/data-management"
            className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition-colors flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-semibold">Upload Data</div>
              <div className="text-sm text-blue-100">Add new experimental data</div>
            </div>
          </Link>

          <Link
            href="/forward-prediction"
            className={`${dark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 hover:bg-gray-900'} text-white rounded-lg p-6 transition-colors flex items-center gap-4`}
          >
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-semibold">Run Prediction</div>
              <div className="text-sm text-gray-300">Forward or inverse analysis</div>
            </div>
          </Link>

          <Link
            href="/results-analysis"
            className={`${dark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-[#64748b] hover:bg-[#475569]'} text-white rounded-lg p-6 transition-colors flex items-center gap-4`}
          >
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-semibold">View Results</div>
              <div className="text-sm text-gray-300">Analyze past predictions</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}