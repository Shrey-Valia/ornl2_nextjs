'use client';

import Link from 'next/link';
import { TrendingUp, Database, Activity, Upload, Play, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useEffect, useState } from 'react';
import { useSettings } from '@/app/context/SettingsContext';
import { getThemeColors } from '@/lib/theme';

type PredictionResult = {
  id: string;
  timestamp: string;
  inputs: { M: number; S: number; I: number; temp: number; time: number; Reaction: number };
  outputs: { conversion: number; mn: number; mw: number; mz: number; mzPlus1: number; mv: number };
  mwdData: { mw: number; predicted: number }[];
};

const STORAGE_KEY = 'mwd_predictions';

export default function Dashboard() {
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

  const { bgCard, borderColor, textPrimary, textSecondary, progressBg, gridStroke, axisColor } = getThemeColors(dark);

  const stats = predictions.length > 0 ? {
    totalPredictions: predictions.length,
    avgConversion: (predictions.reduce((sum, p) => sum + p.outputs.conversion, 0) / predictions.length * 100).toFixed(1),
    avgMw: (predictions.reduce((sum, p) => sum + p.outputs.mw, 0) / predictions.length).toFixed(0),
  } : { totalPredictions: 0, avgConversion: '0', avgMw: '0' };

  // Chart data: conversion trend
  const conversionTrend = predictions.map((p, idx) => ({
    index: idx + 1,
    conversion: p.outputs.conversion * 100,
  }));

  // Chart data: MW distribution
  const mwDistribution = predictions.reduce((acc: any[], p) => {
    const range = Math.floor(p.outputs.mw / 10000) * 10000;
    const existing = acc.find(x => x.range === range);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ range, count: 1, label: `${range / 1000}k-${(range + 10000) / 1000}k` });
    }
    return acc;
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className={`text-3xl font-semibold mb-2 ${textPrimary}`}>ORNL Neural Networks in Polymer Growth</h1>
        <p className={textSecondary}>
          {predictions.length > 0
            ? `You've made ${predictions.length} prediction${predictions.length !== 1 ? 's' : ''} so far`
            : "Welcome! Start by making your first prediction"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-sm ${textSecondary}`}>Total Predictions Made</p>
              <p className={`text-2xl font-semibold mt-1 ${textPrimary}`}>{stats.totalPredictions}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${dark ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          {predictions.length > 0 && (
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={conversionTrend}>
                <Line type="monotone" dataKey="conversion" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-sm ${textSecondary}`}>Average Conversion</p>
              <p className={`text-2xl font-semibold mt-1 ${textPrimary}`}>{stats.avgConversion}%</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${dark ? 'bg-green-900/50' : 'bg-green-100'}`}>
              <Activity className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className={textSecondary}>Conversion Rate</span>
              <span className={`font-medium ${textPrimary}`}>{stats.avgConversion}%</span>
            </div>
            <div className={`w-full rounded-full h-2 ${progressBg}`}>
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(100, parseFloat(stats.avgConversion))}%` }}></div>
            </div>
          </div>
        </div>

        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-sm ${textSecondary}`}>Average Mw</p>
              <p className={`text-2xl font-semibold mt-1 ${textPrimary}`}>{(parseFloat(stats.avgMw) / 1000).toFixed(1)}k</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${dark ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
              <Database className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className={textSecondary}>Avg Molecular Weight</span>
              <span className={`font-medium ${textPrimary}`}>{stats.avgMw} g/mol</span>
            </div>
          </div>
        </div>
      </div>

      {predictions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
            <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Conversion Trend</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={conversionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="index" tick={{ fontSize: 12, fill: axisColor }} stroke={axisColor} />
                <YAxis tick={{ fontSize: 12, fill: axisColor }} stroke={axisColor} />
                <Tooltip contentStyle={{ backgroundColor: dark ? '#1f2937' : '#fff', borderColor: dark ? '#374151' : '#e5e7eb', color: dark ? '#fff' : '#111' }} />
                <Line type="monotone" dataKey="conversion" stroke="#2563eb" strokeWidth={2} name="Conversion (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {mwDistribution.length > 0 && (
            <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
              <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Molecular Weight Distribution</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mwDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: axisColor }} stroke={axisColor} />
                  <YAxis tick={{ fontSize: 12, fill: axisColor }} stroke={axisColor} />
                  <Tooltip contentStyle={{ backgroundColor: dark ? '#1f2937' : '#fff', borderColor: dark ? '#374151' : '#e5e7eb', color: dark ? '#fff' : '#111' }} />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/forward-prediction"
            className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition-colors flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-semibold">Make Prediction</div>
              <div className="text-sm text-blue-100">Run forward analysis</div>
            </div>
          </Link>

          <Link
            href="/inverse-problem"
            className={`${dark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 hover:bg-gray-900'} text-white rounded-lg p-6 transition-colors flex items-center gap-4`}
          >
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-semibold">Inverse Problem</div>
              <div className="text-sm text-gray-300">Find optimal conditions</div>
            </div>
          </Link>

          <Link
            href="/results-analysis"
            className={`${dark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-slate-700 hover:bg-slate-800'} text-white rounded-lg p-6 transition-colors flex items-center gap-4`}
          >
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-semibold">View Results</div>
              <div className="text-sm text-gray-300">Analyze predictions</div>
            </div>
          </Link>
        </div>
      </div>

      {predictions.length > 0 && (
        <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
          <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Recent Predictions</h2>
          <div className="space-y-3">
            {predictions.slice(-5).reverse().map((pred, idx) => (
              <div key={pred.id} className={`flex items-center justify-between p-3 rounded-lg ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div>
                  <div className={`font-medium ${textPrimary}`}>Prediction {predictions.length - idx}</div>
                  <div className={`text-sm ${textSecondary}`}>
                    {new Date(pred.timestamp).toLocaleDateString()} at {new Date(pred.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${textPrimary}`}>{(pred.outputs.conversion * 100).toFixed(1)}% conversion</div>
                  <div className={`text-sm ${textSecondary}`}>Mw: {pred.outputs.mw.toFixed(0)} g/mol</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}