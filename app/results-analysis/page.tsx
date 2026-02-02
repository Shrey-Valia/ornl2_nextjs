'use client';

import { Download, FileImage, FileSpreadsheet, FileJson, ChevronDown, ChevronUp } from 'lucide-react';
import { MWDChart } from '@/app/components/MWDChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { chainLengthData } from '@/lib/mock-data';

const sensitivityData = [
  { param: 'Temp', low: 0.2, med: 0.5, high: 0.9 },
  { param: 'Monomer', low: 0.3, med: 0.6, high: 0.85 },
  { param: 'Time', low: 0.4, med: 0.7, high: 0.8 },
  { param: 'Initiator', low: 0.1, med: 0.3, high: 0.6 },
];

export default function ResultsAnalysis() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Analysis Results - Experiment #2024-156
          </h1>
          <p className="text-gray-600">Comprehensive analysis and comparison</p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <div>Run Date: January 20, 2024</div>
          <div>Model Version: v2.1.3</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MWDChart title="Molecular Weight Distribution Comparison" />

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">R² Score</span>
                <span className="font-semibold text-gray-900">0.943</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-green-600 h-3 rounded-full" style={{ width: '94.3%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Mean Absolute Error</span>
                <span className="font-semibold text-gray-900">0.032</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full" style={{ width: '96.8%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Prediction Confidence</span>
                <span className="font-semibold text-gray-900">91.2%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-purple-600 h-3 rounded-full" style={{ width: '91.2%' }} />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">RMSE</div>
                <div className="font-semibold text-gray-900">0.045</div>
              </div>
              <div>
                <div className="text-gray-600">Max Error</div>
                <div className="font-semibold text-gray-900">0.082</div>
              </div>
              <div>
                <div className="text-gray-600">Pearson r</div>
                <div className="font-semibold text-gray-900">0.971</div>
              </div>
              <div>
                <div className="text-gray-600">Samples</div>
                <div className="font-semibold text-gray-900">45</div>
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
                  <div
                    className="h-8 bg-green-200 rounded-l"
                    style={{ width: `${item.low * 100}px` }}
                  />
                  <div
                    className="h-8 bg-yellow-200"
                    style={{ width: `${item.med * 100}px` }}
                  />
                  <div
                    className="h-8 bg-red-200 rounded-r"
                    style={{ width: `${item.high * 100}px` }}
                  />
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
          <button
            onClick={() => toggleSection('stats')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <h3 className="font-semibold text-gray-900">Statistical Summary</h3>
            {expandedSection === 'stats' ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {expandedSection === 'stats' && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Mean MW</div>
                  <div className="font-medium">45,230 g/mol</div>
                </div>
                <div>
                  <div className="text-gray-600">Median MW</div>
                  <div className="font-medium">42,150 g/mol</div>
                </div>
                <div>
                  <div className="text-gray-600">Std Dev</div>
                  <div className="font-medium">12,450 g/mol</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('model')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <h3 className="font-semibold text-gray-900">Model Information</h3>
            {expandedSection === 'model' ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {expandedSection === 'model' && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Architecture:</span>
                  <span className="font-medium">Feed-forward Neural Network</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Layers:</span>
                  <span className="font-medium">4 (128-64-32-1)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Activation:</span>
                  <span className="font-medium">ReLU / Sigmoid</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Training Samples:</span>
                  <span className="font-medium">45 batch experiments</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Export Options</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FileImage className="w-4 h-4 text-gray-600" />
            <span>PNG</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FileImage className="w-4 h-4 text-gray-600" />
            <span>PDF</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FileSpreadsheet className="w-4 h-4 text-gray-600" />
            <span>CSV</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FileJson className="w-4 h-4 text-gray-600" />
            <span>JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
}