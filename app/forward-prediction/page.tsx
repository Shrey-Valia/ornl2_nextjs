'use client';

import { Info, Save, Download } from 'lucide-react';
import { EmptyMWDChart } from '@/app/components/EmptyMWDChart';
import { useState } from 'react';

export default function ForwardPrediction() {
  const [reactor, setReactor] = useState('batch');
  
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Forward Prediction</h1>
        <p className="text-gray-600">
          Predict molecular weight distribution from reaction conditions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Reactor Configuration</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="reactor"
                  value="batch"
                  checked={reactor === 'batch'}
                  onChange={(e) => setReactor(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-900">Batch Reactor</span>
              </label>
              <label className="flex items-center gap-3 cursor-not-allowed opacity-50">
                <input
                  type="radio"
                  name="reactor"
                  value="flow"
                  disabled
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-400 flex items-center gap-2">
                  Flow Reactor
                  <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                    Coming Soon
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Reaction Conditions</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monomer Concentration (mol/L)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g., 2.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initiator Concentration (mol/L)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 0.05"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 70"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reaction Time (minutes)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 120"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              Kinetic Parameters
              <button className="text-gray-400 hover:text-gray-600">
                <Info className="w-4 h-4" />
              </button>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Propagation Rate (L/mol·s)
                  <button className="text-gray-400 hover:text-gray-600">
                    <Info className="w-3 h-3" />
                  </button>
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder="e.g., 1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Termination Rate (L/mol·s)
                  <button className="text-gray-400 hover:text-gray-600">
                    <Info className="w-3 h-3" />
                  </button>
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder="e.g., 100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Predict MWD
          </button>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <EmptyMWDChart />

          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Save className="w-4 h-4" />
              Save Prediction
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4" />
              Export Graph
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">How to use:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Select your reactor configuration (currently Batch only)</li>
                  <li>Enter reaction conditions and kinetic parameters</li>
                  <li>Click &quot;Predict MWD&quot; to generate molecular weight distribution</li>
                  <li>Review results and export if needed</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}