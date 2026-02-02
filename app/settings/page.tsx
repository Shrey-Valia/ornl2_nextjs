'use client';

import { ChevronDown, ChevronUp, Save, RotateCcw } from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['model']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Settings & Configuration</h1>
        <p className="text-gray-600">Customize neural network and application preferences</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('model')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <h2 className="font-semibold text-gray-900">Model Configuration</h2>
            {expandedSections.has('model') ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {expandedSections.has('model') && (
            <div className="px-6 py-4 border-t border-gray-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Neural Network Version
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>v2.1.3 (Current - Recommended)</option>
                  <option>v2.1.2 (Stable)</option>
                  <option>v2.1.0 (Legacy)</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">Select the model version for predictions</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Use GPU Acceleration</div>
                  <div className="text-sm text-gray-500">Enable GPU for faster training and predictions</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prediction Confidence Threshold (%)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="70"
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-medium text-gray-900">70</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">Minimum confidence for valid predictions</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('preprocessing')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <h2 className="font-semibold text-gray-900">Data Preprocessing</h2>
            {expandedSections.has('preprocessing') ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {expandedSections.has('preprocessing') && (
            <div className="px-6 py-4 border-t border-gray-200 space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                  <div>
                    <div className="font-medium text-gray-900">Normalize Input Data</div>
                    <div className="text-sm text-gray-500">Scale features to 0-1 range</div>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                  <div>
                    <div className="font-medium text-gray-900">Outlier Detection</div>
                    <div className="text-sm text-gray-500">Identify and flag anomalous data points</div>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                  <div>
                    <div className="font-medium text-gray-900">Data Augmentation</div>
                    <div className="text-sm text-gray-500">Generate synthetic training samples</div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('visualization')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <h2 className="font-semibold text-gray-900">Visualization Preferences</h2>
            {expandedSections.has('visualization') ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {expandedSections.has('visualization') && (
            <div className="px-6 py-4 border-t border-gray-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chart Color Scheme
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Default (Blue/Orange)</option>
                  <option>Colorblind Friendly</option>
                  <option>Grayscale</option>
                  <option>High Contrast</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Show Confidence Intervals</div>
                  <div className="text-sm text-gray-500">Display uncertainty ranges on predictions</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Display Error Bars</div>
                  <div className="text-sm text-gray-500">Show standard deviation on charts</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('export')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <h2 className="font-semibold text-gray-900">Export Settings</h2>
            {expandedSections.has('export') ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {expandedSections.has('export') && (
            <div className="px-6 py-4 border-t border-gray-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default File Format
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>CSV</option>
                  <option>Excel (.xlsx)</option>
                  <option>JSON</option>
                  <option>HDF5</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Graph Resolution (DPI)
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>72 (Screen)</option>
                  <option>150 (Medium)</option>
                  <option>300 (Print Quality)</option>
                  <option>600 (High Quality)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Include Metadata</div>
                  <div className="text-sm text-gray-500">Add model version and timestamps to exports</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('advanced')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <h2 className="font-semibold text-gray-900">Advanced Options</h2>
            {expandedSections.has('advanced') ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {expandedSections.has('advanced') && (
            <div className="px-6 py-4 border-t border-gray-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Size (for training)
                </label>
                <input
                  type="number"
                  defaultValue="32"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">Number of samples per training batch</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learning Rate
                </label>
                <input
                  type="number"
                  step="0.0001"
                  defaultValue="0.001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">Model training learning rate</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Early Stopping Criteria (epochs)
                </label>
                <input
                  type="number"
                  defaultValue="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">Stop training if no improvement</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
        <button className="flex items-center gap-2 border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50">
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}