'use client';

import Link from 'next/link';
import { TrendingUp, Database, Activity, Upload, Play, Eye } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { recentPredictions, predictionData } from '@/lib/mock-data';

export default function Dashboard() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          ORNL Neural Networks in Polymer Growth
        </h1>
        <p className="text-gray-600">
          Welcome back! Here&apos;s an overview of your neural network analysis system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Recent Predictions</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">156</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={recentPredictions}>
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Model Accuracy</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">94.3%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">R² Score</span>
              <span className="text-gray-900 font-medium">0.943</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '94.3%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Total Experiments</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">45</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Batch Reactor</span>
              <span className="text-gray-900 font-medium">45</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Flow Reactor</span>
              <span className="text-amber-600 font-medium">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dataset Status</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Batch Reactor</span>
                <span className="text-sm font-medium text-gray-900">45 experiments</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Flow Reactor</span>
                <span className="text-sm font-medium text-amber-600">Coming Soon</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-amber-400 h-2 rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Model Performance Metrics</h2>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={predictionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="predictions" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
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
            className="bg-gray-800 text-white rounded-lg p-6 hover:bg-gray-900 transition-colors flex items-center gap-4"
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
            className="bg-[#64748b] text-white rounded-lg p-6 hover:bg-[#475569] transition-colors flex items-center gap-4"
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