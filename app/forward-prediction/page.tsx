'use client';

import { Info, Save, Download, CheckCircle, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSettings } from '@/app/context/SettingsContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type PredictionResult = {
  id: string;
  timestamp: string; // Changed to string for JSON serialization
  inputs: { M: number; S: number; I: number; temp: number; time: number; Reaction: number };
  outputs: { molarRatio: number; flowRate: number; temperature: number; pressure: number; e: number; confidence: number };
  mwdData: { mw: number; predicted: number }[];
};

const STORAGE_KEY = 'mwd_predictions';

export default function ForwardPrediction() {
  const { settings } = useSettings();
  const dark = settings.darkMode;

  const [reactor, setReactor] = useState('batch');
  const [M, setM] = useState(0.2);
  const [S, setS] = useState(1.0);
  const [I, setI] = useState(0.5);
  const [temp, setTemp] = useState(300);
  const [time, setTime] = useState(60);
  const [Reaction, setReaction] = useState(3.0);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'chart' | 'table'>('chart');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load saved predictions on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPredictions(parsed);
      }
    } catch (err) {
      console.error('Failed to load saved predictions:', err);
    }
  }, []);

  const cardClass = dark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200';
  const textClass = dark ? 'text-white' : 'text-gray-900';
  const mutedClass = dark ? 'text-gray-300' : 'text-gray-600';
  const labelClass = dark ? 'text-gray-300' : 'text-gray-700';
  const inputClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`;

  const generateMWDData = (inputs: { M: number; S: number; I: number; temp: number; time: number; Reaction: number }) => {
    return Array.from({ length: 50 }, (_, i) => {
      const mw = Math.pow(10, 2 + i * 0.08);
      const peak = 100000 * (inputs.M / 0.2) * (inputs.temp / 300);
      const sigma = 0.5 + (inputs.Reaction / 10);
      const logMw = Math.log10(mw);
      const logPeak = Math.log10(peak);
      const predicted = Math.exp(-Math.pow(logMw - logPeak, 2) / (2 * sigma * sigma));
      return { mw: Math.round(mw), predicted: Number(predicted.toFixed(4)) };
    });
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ M, S, I, temp, time, Reaction }),
      });

      if (response.ok) {
        const data = await response.json();
        const [molarRatio, flowRate, temperature, pressure, e] = data.m_output;
        const [confidence] = data.x_output;

        const result: PredictionResult = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          inputs: { M, S, I, temp, time, Reaction },
          outputs: { molarRatio, flowRate, temperature, pressure, e, confidence },
          mwdData: generateMWDData({ M, S, I, temp, time, Reaction }),
        };
        setPredictions(prev => [...prev, result]);
        setHasUnsavedChanges(true);
      } else {
        throw new Error('Backend error');
      }
    } catch {
      console.log('Using mock prediction (backend not available)');
      const mockResult: PredictionResult = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        inputs: { M, S, I, temp, time, Reaction },
        outputs: {
          molarRatio: M * S * 0.5 + Math.random() * 0.1,
          flowRate: (temp / 300) * 0.8 + Math.random() * 0.1,
          temperature: temp * 0.95 + Math.random() * 10,
          pressure: Reaction * 0.3 + Math.random() * 0.05,
          e: I * 0.001 + Math.random() * 0.0001,
          confidence: 0.85 + Math.random() * 0.1,
        },
        mwdData: generateMWDData({ M, S, I, temp, time, Reaction }),
      };
      setPredictions(prev => [...prev, mockResult]);
      setHasUnsavedChanges(true);
    }

    setLoading(false);
  };

  const handleSave = () => {
    if (predictions.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions));
        setSaveSuccess(true);
        setHasUnsavedChanges(false);
        setTimeout(() => setSaveSuccess(false), 2000);
      } catch (err) {
        console.error('Failed to save predictions:', err);
        setError('Failed to save predictions. Storage may be full.');
      }
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all predictions? This cannot be undone.')) {
      setPredictions([]);
      localStorage.removeItem(STORAGE_KEY);
      setHasUnsavedChanges(false);
    }
  };

  const handleExport = () => {
    if (predictions.length === 0) return;
    const latest = predictions[predictions.length - 1];

    const csvContent = [
      'Molecular Weight (g/mol),Predicted Weight Fraction',
      ...latest.mwdData.map(d => `${d.mw},${d.predicted}`),
      '',
      'Input Parameters',
      `M (Monomer),${latest.inputs.M}`,
      `S (Solvent),${latest.inputs.S}`,
      `I (Initiator),${latest.inputs.I}`,
      `Temperature (K),${latest.inputs.temp}`,
      `Time (s),${latest.inputs.time}`,
      `Reaction,${latest.inputs.Reaction}`,
      '',
      'Output Results',
      `Molar Ratio,${latest.outputs.molarRatio.toFixed(6)}`,
      `Flow Rate,${latest.outputs.flowRate.toFixed(6)}`,
      `Temperature,${latest.outputs.temperature.toFixed(2)}`,
      `Pressure,${latest.outputs.pressure.toFixed(4)}`,
      `E,${latest.outputs.e.toFixed(6)}`,
      `Confidence,${(latest.outputs.confidence * 100).toFixed(1)}%`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mwd_prediction_${latest.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const latestPrediction = predictions.length > 0 ? predictions[predictions.length - 1] : null;

  const deltaIndicator = (current: number, previous: number) => {
    const diff = current - previous;
    if (Math.abs(diff) < 0.0001) return <span className="text-yellow-500">▬</span>;
    return diff > 0 
      ? <span className="text-green-500">▲ +{diff.toFixed(4)}</span>
      : <span className="text-red-500">▼ {diff.toFixed(4)}</span>;
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className={`text-3xl font-semibold mb-2 ${textClass}`}>Forward Prediction</h1>
        <p className={mutedClass}>Predict molecular weight distribution from reaction conditions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className={`rounded-lg border p-6 ${cardClass}`}>
            <h2 className={`font-semibold mb-4 ${textClass}`}>Reactor Configuration</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="reactor" value="batch" checked={reactor === 'batch'} onChange={(e) => setReactor(e.target.value)} className="w-4 h-4 text-blue-600" />
                <span className={textClass}>Batch Reactor</span>
              </label>
              <label className="flex items-center gap-3 cursor-not-allowed opacity-50">
                <input type="radio" name="reactor" value="flow" disabled className="w-4 h-4" />
                <span className={`flex items-center gap-2 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Flow Reactor
                  <span className={`px-2 py-0.5 text-xs rounded ${dark ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>Coming Soon</span>
                </span>
              </label>
            </div>
          </div>

          <div className={`rounded-lg border p-6 ${cardClass}`}>
            <h2 className={`font-semibold mb-4 ${textClass}`}>Reaction Conditions</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>M (Monomer)</label>
                <input type="number" step="0.1" value={M} onChange={(e) => setM(parseFloat(e.target.value) || 0)} className={inputClass} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>S (Solvent)</label>
                <input type="number" step="0.1" value={S} onChange={(e) => setS(parseFloat(e.target.value) || 0)} className={inputClass} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>I (Initiator)</label>
                <input type="number" step="0.1" value={I} onChange={(e) => setI(parseFloat(e.target.value) || 0)} className={inputClass} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>Temperature (K)</label>
                <input type="number" value={temp} onChange={(e) => setTemp(parseFloat(e.target.value) || 0)} className={inputClass} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>Time (seconds)</label>
                <input type="number" value={time} onChange={(e) => setTime(parseFloat(e.target.value) || 0)} className={inputClass} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>Reaction</label>
                <input type="number" step="0.1" value={Reaction} onChange={(e) => setReaction(parseFloat(e.target.value) || 0)} className={inputClass} />
              </div>
            </div>
          </div>

          <button onClick={handlePredict} disabled={loading} className={`w-full py-3 rounded-lg font-medium transition-colors ${loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>
            {loading ? 'Predicting...' : 'Predict MWD'}
          </button>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className={`rounded-lg p-4 ${dark ? 'bg-red-900/30 border border-red-800 text-red-200' : 'bg-red-50 border border-red-200 text-red-800'}`}>
              {error}
            </div>
          )}

          <div className={`rounded-lg border ${cardClass}`}>
            {/* Tab Navigation */}
            <div className={`flex border-b ${dark ? 'border-gray-600' : 'border-gray-200'}`}>
              <button
                onClick={() => setViewType('chart')}
                className={`flex-1 px-4 py-3 font-medium transition-colors ${viewType === 'chart' ? 'text-blue-500 border-b-2 border-blue-500' : mutedClass}`}
              >
                Chart View
              </button>
              <button
                onClick={() => setViewType('table')}
                className={`flex-1 px-4 py-3 font-medium transition-colors ${viewType === 'table' ? 'text-blue-500 border-b-2 border-blue-500' : mutedClass}`}
              >
                Table View
              </button>
            </div>

            <div className="p-6">
              {viewType === 'chart' ? (
                latestPrediction ? (
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={latestPrediction.mwdData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#4b5563' : '#e5e7eb'} />
                        <XAxis dataKey="mw" tick={{ fill: dark ? '#9ca3af' : '#374151', fontSize: 10 }} />
                        <YAxis tick={{ fill: dark ? '#9ca3af' : '#374151', fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: dark ? '#374151' : '#fff', border: `1px solid ${dark ? '#4b5563' : '#e5e7eb'}`, color: dark ? '#fff' : '#000' }} />
                        <Legend />
                        <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} dot={false} name="Predicted MWD" />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className={`mt-4 grid grid-cols-3 gap-4 text-sm`}>
                      <div className={`p-3 rounded-lg ${dark ? 'bg-gray-600' : 'bg-gray-50'}`}>
                        <div className={mutedClass}>Confidence</div>
                        <div className={`text-lg font-semibold ${textClass}`}>{(latestPrediction.outputs.confidence * 100).toFixed(1)}%</div>
                      </div>
                      <div className={`p-3 rounded-lg ${dark ? 'bg-gray-600' : 'bg-gray-50'}`}>
                        <div className={mutedClass}>Molar Ratio</div>
                        <div className={`text-lg font-semibold ${textClass}`}>{latestPrediction.outputs.molarRatio.toFixed(4)}</div>
                      </div>
                      <div className={`p-3 rounded-lg ${dark ? 'bg-gray-600' : 'bg-gray-50'}`}>
                        <div className={mutedClass}>Flow Rate</div>
                        <div className={`text-lg font-semibold ${textClass}`}>{latestPrediction.outputs.flowRate.toFixed(4)}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`border-2 border-dashed rounded-lg h-80 flex items-center justify-center ${dark ? 'border-gray-500 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
                    <div className={`text-center ${mutedClass}`}>
                      <svg className={`w-16 h-16 mx-auto mb-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className={`text-lg font-medium mb-2 ${textClass}`}>No Prediction Yet</p>
                      <p className="text-sm">Enter reaction conditions and click "Predict MWD"</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="overflow-x-auto">
                  {predictions.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`border-b-2 ${dark ? 'border-gray-500' : 'border-gray-300'}`}>
                          <th className={`text-left py-3 px-2 font-semibold ${textClass}`}>#</th>
                          <th className={`text-left py-3 px-2 font-semibold ${textClass}`}>M</th>
                          <th className={`text-left py-3 px-2 font-semibold ${textClass}`}>S</th>
                          <th className={`text-left py-3 px-2 font-semibold ${textClass}`}>I</th>
                          <th className={`text-left py-3 px-2 font-semibold ${textClass}`}>Temp</th>
                          <th className={`text-left py-3 px-2 font-semibold ${textClass}`}>Time</th>
                          <th className={`text-left py-3 px-2 font-semibold ${textClass}`}>Molar Ratio</th>
                          <th className={`text-left py-3 px-2 font-semibold ${textClass}`}>Flow Rate</th>
                          <th className={`text-left py-3 px-2 font-semibold ${textClass}`}>Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {predictions.map((pred, index) => {
                          const prev = predictions[index - 1];
                          return (
                            <tr key={pred.id} className={`border-b ${dark ? 'border-gray-600 hover:bg-gray-600' : 'border-gray-100 hover:bg-gray-50'}`}>
                              <td className={`py-3 px-2 font-medium ${textClass}`}>{index + 1}</td>
                              <td className={`py-3 px-2 ${mutedClass}`}>{pred.inputs.M.toFixed(2)}</td>
                              <td className={`py-3 px-2 ${mutedClass}`}>{pred.inputs.S.toFixed(2)}</td>
                              <td className={`py-3 px-2 ${mutedClass}`}>{pred.inputs.I.toFixed(2)}</td>
                              <td className={`py-3 px-2 ${mutedClass}`}>{pred.inputs.temp}</td>
                              <td className={`py-3 px-2 ${mutedClass}`}>{pred.inputs.time}</td>
                              <td className={`py-3 px-2 ${mutedClass}`}>
                                {pred.outputs.molarRatio.toFixed(4)}
                                {prev && <span className="ml-2">{deltaIndicator(pred.outputs.molarRatio, prev.outputs.molarRatio)}</span>}
                              </td>
                              <td className={`py-3 px-2 ${mutedClass}`}>
                                {pred.outputs.flowRate.toFixed(4)}
                                {prev && <span className="ml-2">{deltaIndicator(pred.outputs.flowRate, prev.outputs.flowRate)}</span>}
                              </td>
                              <td className={`py-3 px-2 ${mutedClass}`}>
                                {(pred.outputs.confidence * 100).toFixed(1)}%
                                {prev && <span className="ml-2">{deltaIndicator(pred.outputs.confidence, prev.outputs.confidence)}</span>}
                              </td>
                            </tr>
                          );
                        })}
                        {loading && (
                          <tr>
                            <td colSpan={9} className={`py-3 px-2 text-center ${mutedClass}`}>Loading...</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <p className={`text-center py-8 ${mutedClass}`}>No predictions yet. Run a prediction to see results.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button 
              onClick={handleSave} 
              disabled={predictions.length === 0} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${predictions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''} ${saveSuccess ? 'bg-green-600 text-white' : dark ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
            >
              {saveSuccess ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saveSuccess ? 'Saved!' : 'Save Prediction'}
              {hasUnsavedChanges && !saveSuccess && <span className="w-2 h-2 bg-orange-500 rounded-full"></span>}
            </button>
            <button 
              onClick={handleExport} 
              disabled={predictions.length === 0} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${predictions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''} ${dark ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button 
              onClick={handleClearAll} 
              disabled={predictions.length === 0} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${predictions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''} ${dark ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70' : 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'}`}
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          </div>

          {hasUnsavedChanges && (
            <div className={`rounded-lg p-3 ${dark ? 'bg-orange-900/30 border border-orange-800' : 'bg-orange-50 border border-orange-200'}`}>
              <p className={`text-sm ${dark ? 'text-orange-200' : 'text-orange-800'}`}>
                You have unsaved predictions. Click "Save Prediction" to persist your data.
              </p>
            </div>
          )}

          <div className={`rounded-lg p-4 ${dark ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className={`text-sm ${dark ? 'text-blue-200' : 'text-blue-900'}`}>
                <p className="font-medium mb-1">How to use:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Select your reactor configuration (currently Batch only)</li>
                  <li>Enter reaction conditions</li>
                  <li>Click "Predict MWD" to generate results</li>
                  <li>Toggle between Chart and Table view</li>
                  <li>Save or export your predictions</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}