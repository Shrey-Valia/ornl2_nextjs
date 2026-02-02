'use client';

import { Info, Save, Download } from 'lucide-react';
import { EmptyMWDChart } from '@/app/components/EmptyMWDChart';
import { WarningBanner } from '@/app/components/WarningBanner';
import { useState } from 'react';
import { getModelPrediction, ModelInput, ModelOutput } from '@/lib/model';

export default function ForwardPrediction() {
  const [reactor, setReactor] = useState('batch');
  const [outputs, setOutputs] = useState<(ModelInput & ModelOutput)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState<'chart' | 'table'>('chart');
  const [M, setM] = useState(0.2);
  const [S, setS] = useState(1.0);
  const [I, setI] = useState(0.5);
  const [temp, setTemp] = useState(300);
  const [time, setTime] = useState(60);
  const [Reaction, setReaction] = useState(3.0);

  const handleRunPrediction = () => {
    setError(null);
    setLoading(true);
    const inputs = {
      M,
      S,
      I,
      temp,
      time,
      Reaction,
    }
    const pred = getModelPrediction(inputs);
    pred.then(res => {
      console.log('Prediction result:', res);
      setOutputs(prev => [...prev, { ...inputs, ...res }]);
      setLoading(false);
    }).catch(err => {
      console.error('Prediction error:', err);
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    });
  }

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
                  M (Monomer)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={M}
                  onChange={(e) => setM(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  S (Solvent)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={S}
                  onChange={(e) => setS(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I (Initiator)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={I}
                  onChange={(e) => setI(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature (K)
                </label>
                <input
                  type="number"
                  value={temp}
                  onChange={(e) => setTemp(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time (seconds)
                </label>
                <input
                  type="number"
                  value={time}
                  onChange={(e) => setTime(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reaction
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={Reaction}
                  onChange={(e) => setReaction(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleRunPrediction}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Predict MWD
          </button>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {error && (
            <WarningBanner
              type="warning"
              message={error}
              actionText="Dismiss"
              onAction={() => setError(null)}
            />
          )}

          <div className="bg-white rounded-lg border border-gray-200">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setViewType('chart')}
                className={`flex-1 px-4 py-3 font-medium transition-colors ${viewType === 'chart'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Chart View
              </button>
              <button
                onClick={() => setViewType('table')}
                className={`flex-1 px-4 py-3 font-medium transition-colors ${viewType === 'table'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Table View
              </button>
            </div>
            <div className="p-6">
              {viewType === 'chart' ? (
                <EmptyMWDChart />
              ) : (
                <div className="overflow-x-auto">
                  {outputs.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-300">
                          <th colSpan={7} className="text-center py-3 px-4 font-semibold text-gray-900 border-r border-gray-300">Input Parameters</th>
                          <th colSpan={7} className="text-center py-3 px-4 font-semibold text-gray-900">Output Results</th>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-xs">Run #</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-xs">M</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-xs">S</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-xs">I</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-xs">Temp (K)</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-xs">Time (s)</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-xs">Reaction</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-xs">Molar Ratio</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-xs">Flow Rate</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-xs">Temp</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-xs">Pressure</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-xs">E</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-xs">Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {outputs.map((output, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-gray-900 font-medium">{index + 1}</td>
                            <td className="py-3 px-4 text-gray-700">{output.M?.toFixed(4)}</td>
                            <td className="py-3 px-4 text-gray-700">{output.S?.toFixed(4)}</td>
                            <td className="py-3 px-4 text-gray-700">{output.I?.toFixed(4)}</td>
                            <td className="py-3 px-4 text-gray-700">{output.temp?.toFixed(1)}</td>
                            <td className="py-3 px-4 text-gray-700">{output.time?.toFixed(1)}</td>
                            <td className="py-3 px-4 text-gray-700">{output.Reaction?.toFixed(4)}</td>
                            <td className="py-3 px-4 text-gray-700">{output.molarRatio?.toFixed(6)}</td>
                            <td className="py-3 px-4 text-gray-700">{output.flowRate?.toFixed(6)}</td>
                            <td className="py-3 px-4 text-gray-700">{output.temperature?.toFixed(2)}</td>
                            <td className="py-3 px-4 text-gray-700">{output.pressure?.toFixed(4)}</td>
                            <td className="py-3 px-4 text-gray-700">{output.e?.toFixed(6)}</td>
                            <td className="py-3 px-4 text-gray-700">{output.confidence?.toFixed(4)}</td>
                          </tr>
                        ))}
                        {loading && <span>Loading Next...</span>}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No predictions yet. Run a prediction to see results.</p>
                  )}
                </div>
              )}
            </div>
          </div>

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