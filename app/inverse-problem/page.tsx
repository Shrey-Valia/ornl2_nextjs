'use client';

import { Upload, Pen, Eraser, RefreshCw, Play } from 'lucide-react';
import { WarningBanner } from '@/app/components/WarningBanner';
import { useState } from 'react';

export default function InverseProblem() {
  const [activeTab, setActiveTab] = useState<'upload' | 'draw'>('upload');

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Inverse Problem Solver</h1>
        <p className="text-gray-600">
          Find optimal reaction conditions from target molecular weight distribution
        </p>
      </div>

      <WarningBanner
        type="warning"
        message="Predictions are based on limited batch reactor data - validate experimentally before implementation."
        actionText="Learn More"
      />

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upload Target MWD
            </button>
            <button
              onClick={() => setActiveTab('draw')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'draw'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Draw Target Distribution
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'upload' ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload Target MWD Data
              </h3>
              <p className="text-gray-600 mb-4">
                CSV or Excel file with MW and weight fraction columns
              </p>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Choose File
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex gap-2">
                <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                  <Pen className="w-4 h-4" />
                  Draw
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                  <Eraser className="w-4 h-4" />
                  Erase
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                  <RefreshCw className="w-4 h-4" />
                  Clear
                </button>
              </div>
              <div className="border border-gray-300 rounded-lg h-96 bg-gray-50 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="mb-2">Click and drag to draw your target distribution</p>
                  <div className="text-sm space-y-1">
                    <p>X-axis: Molecular Weight (g/mol)</p>
                    <p>Y-axis: Weight Fraction (0-1)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <button className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700">
          <Play className="w-5 h-5" />
          Solve Inverse Problem
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Predicted Reaction Conditions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Monomer Concentration', value: '2.73', unit: 'mol/L', confidence: 85 },
            { label: 'Temperature', value: '72.5', unit: '°C', confidence: 78 },
            { label: 'Reaction Time', value: '135', unit: 'min', confidence: 82 },
            { label: 'Initiator Conc.', value: '0.048', unit: 'mol/L', confidence: 68 },
          ].map((param) => (
            <div key={param.label} className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">{param.label}</div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">
                {param.value}
                <span className="text-sm text-gray-600 ml-1">{param.unit}</span>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Confidence</span>
                  <span className={param.confidence < 70 ? 'text-amber-600' : 'text-green-600'}>
                    {param.confidence}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      param.confidence < 70 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${param.confidence}%` }}
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500">Range: ±10%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}