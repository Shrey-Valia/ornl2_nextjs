// FILENAME: app/forward-prediction/page.tsx

'use client';

import { Info, Save, Download } from 'lucide-react';
import { EmptyMWDChart } from '@/app/components/EmptyMWDChart';
import { WarningBanner } from '@/app/components/WarningBanner';
import { ReactElement, useState } from 'react';
import { getModelPrediction, ModelInput, ModelOutput } from '@/lib/model';
import { useSettings } from '@/app/context/SettingsContext';

type TableEntry = ModelInput & ModelOutput;

export default function ForwardPrediction() {
  const { settings } = useSettings();
  const dark = settings.darkMode;

  const bgClass = dark ? 'bg-gray-800' : 'bg-white';
  const borderClass = dark ? 'border-gray-700' : 'border-gray-200';
  const textClass = dark ? 'text-white' : 'text-gray-900';
  const mutedClass = dark ? 'text-gray-400' : 'text-gray-600';
  const hoverClass = dark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const inputBgClass = dark ? 'bg-gray-700' : 'bg-white';
  const inputBorderClass = dark ? 'border-gray-600' : 'border-gray-300';
  const inputTextClass = dark ? 'text-white' : 'text-gray-900';

  const [reactor, setReactor] = useState('batch');
  const [outputs, setOutputs] = useState<TableEntry[]>([]);
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

  function deltaIndicator(value: number): ReactElement {
    return (<span className={value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-yellow-600'}>
      {value > 0 ? '▲' : value < 0 ? '▼' : '▬'} {value == 0 || value.toFixed(4)}
    </span>);
  }

  const fieldConfig = [
    { key: 'M', label: 'M', decimals: 4 },
    { key: 'S', label: 'S', decimals: 4 },
    { key: 'I', label: 'I', decimals: 4 },
    { key: 'temp', label: 'Temp (K)', decimals: 1 },
    { key: 'time', label: 'Time (s)', decimals: 1 },
    { key: 'Reaction', label: 'Reaction', decimals: 4 },
    { key: 'molarRatio', label: 'Molar Ratio', decimals: 6 },
    { key: 'flowRate', label: 'Flow Rate', decimals: 6 },
    { key: 'temperature', label: 'Temp', decimals: 2 },
    { key: 'pressure', label: 'Pressure', decimals: 4 },
    { key: 'e', label: 'E', decimals: 6 },
    { key: 'confidence', label: 'Confidence', decimals: 4 },
  ] as const;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className={`text-3xl font-semibold mb-2 ${textClass}`}>Forward Prediction</h1>
        <p className={mutedClass}>
          Predict molecular weight distribution from reaction conditions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className={`${bgClass} rounded-lg border ${borderClass} p-6`}>
            <h2 className={`font-semibold mb-4 ${textClass}`}>Reactor Configuration</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="reactor"
                  value="batch"
                  checked={reactor === 'batch'}
                  onChange={(e) => setReactor(e.target.value || 'batch')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className={textClass}>Batch Reactor</span>
              </label>
              <label className="flex items-center gap-3 cursor-not-allowed opacity-50">
                <input
                  type="radio"
                  name="reactor"
                  value="flow"
                  disabled
                  className="w-4 h-4 text-blue-600"
                />
                <span className={`${mutedClass} flex items-center gap-2`}>
                  Flow Reactor
                  <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                    Coming Soon
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className={`${bgClass} rounded-lg border ${borderClass} p-6`}>
            <h2 className={`font-semibold mb-4 ${textClass}`}>Reaction Conditions</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  M (Monomer)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={M}
                  onChange={(e) => setM(parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border ${inputBorderClass} ${inputBgClass} ${inputTextClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  S (Solvent)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={S}
                  onChange={(e) => setS(parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border ${inputBorderClass} ${inputBgClass} ${inputTextClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  I (Initiator)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={I}
                  onChange={(e) => setI(parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border ${inputBorderClass} ${inputBgClass} ${inputTextClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Temperature (K)
                </label>
                <input
                  type="number"
                  value={temp}
                  onChange={(e) => setTemp(parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border ${inputBorderClass} ${inputBgClass} ${inputTextClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Time (seconds)
                </label>
                <input
                  type="number"
                  value={time}
                  onChange={(e) => setTime(parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border ${inputBorderClass} ${inputBgClass} ${inputTextClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Reaction
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={Reaction}
                  onChange={(e) => setReaction(parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border ${inputBorderClass} ${inputBgClass} ${inputTextClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
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

          <div className={`${bgClass} rounded-lg border ${borderClass}`}>
            <div className={`flex border-b ${borderClass}`}>
              <button
                onClick={() => setViewType('chart')}
                className={`flex-1 px-4 py-3 font-medium transition-colors ${viewType === 'chart'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : `${mutedClass} ${dark ? 'hover:text-white' : 'hover:text-gray-900'}`
                  }`}
              >
                Chart View
              </button>
              <button
                onClick={() => setViewType('table')}
                className={`flex-1 px-4 py-3 font-medium transition-colors ${viewType === 'table'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : `${mutedClass} ${dark ? 'hover:text-white' : 'hover:text-gray-900'}`
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
                        <tr className={`border-b-2 ${dark ? 'border-gray-600' : 'border-gray-300'}`}>
                          <th colSpan={7} className={`text-center py-3 px-4 font-semibold ${textClass} border-r ${dark ? 'border-gray-600' : 'border-gray-300'}`}>Input Parameters</th>
                          <th colSpan={7} className={`text-center py-3 px-4 font-semibold ${textClass}`}>Output Results</th>
                        </tr>
                        <tr className={`border-b ${borderClass}`}>
                          {fieldConfig.map(({ label }) => (
                            <th key={label} className={`text-left py-3 px-4 font-semibold ${textClass} text-xs`}>{label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {outputs.map((output, index) => {
                          const previousOutput = outputs[index - 1];
                          return (
                            <tr key={index} className={`border-b ${dark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'}`}>
                              <td className={`py-3 px-4 ${textClass} font-medium`}>{index}</td>
                              {fieldConfig.map(({ key, decimals }) => (
                                <td key={key} className={`py-3 px-4 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {(output[key as keyof typeof output] as number)?.toFixed(decimals)} {index > 0 && deltaIndicator((output[key as keyof typeof output] as number) - (previousOutput[key as keyof typeof previousOutput] as number))}
                                </td>
                              ))}
                            </tr>
                          )
                        })}
                        {loading && (
                          <tr>
                            <td colSpan={13} className={`py-3 px-4 text-center ${mutedClass}`}>Loading Next...</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <p className={`text-center ${mutedClass} py-8`}>No predictions yet. Run a prediction to see results.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button className={`flex items-center gap-2 px-4 py-2 border ${borderClass} rounded-lg ${hoverClass}`}>
              <Save className="w-4 h-4" />
              Save Prediction
            </button>
            <button className={`flex items-center gap-2 px-4 py-2 border ${borderClass} rounded-lg ${hoverClass}`}>
              <Download className="w-4 h-4" />
              Export Graph
            </button>
          </div>

          <div className={`rounded-lg border p-4 ${dark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className={`text-sm ${dark ? 'text-blue-200' : 'text-blue-900'}`}>
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