'use client';

import { Info, Save, Download, CheckCircle, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSettings } from '@/app/context/SettingsContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { getModelPrediction } from '@/lib/model';

type PredictionResult = {
  id: string;
  timestamp: string;
  inputs: { M: number; S: number; I: number; temp: number; time: number; Reaction: number };
  outputs: { conversion: number; mn: number; mw: number; mz: number; mzPlus1: number; mv: number };
  mwdData: { mw: number; predicted: number }[];
};

const STORAGE_KEY = 'mwd_predictions';

// Regime clustering constants (derived from PMMAordered.csv outputs)
// Features: [X, log10(Mn), log10(Mw), log10(Mz), log10(Mz+1), log10(Mv)]
const OUTPUT_MEAN = [0.5503680109977722, 4.057345390319824, 4.341544151306152, 4.5676469802856445, 4.669567108154297, 4.306144714355469];
const OUTPUT_STD = [0.2719201147556305, 0.370608925819397, 0.36066654324531555, 0.36696329712867737, 0.37130263447761536, 0.36037853360176086];

const REGIMES = [
  {
    id: 'A',
    name: 'Low conversion / High MW',
    description: 'Lower conversion but much larger chains.',
    centroidStd: [-0.7392516732215881, 1.3128490447998047, 1.3950982093811035, 1.3370122909545898, 1.4410820007324219, 1.3915222883224487],
    meanOutputs: [0.34935060143470764, 36212.58203125, 70831.8359375, 115370.0, 161616.75, 65114.66796875],
  },
  {
    id: 'B',
    name: 'High conversion / Low MW',
    description: 'Higher conversion with smaller chains.',
    centroidStd: [0.23271799087524414, -1.4100115299224854, -1.4184603691101074, -1.4678593873977661, -1.3589848279953003, -1.4174177646636963],
    meanOutputs: [0.6136487722396851, 3614.199951171875, 6863.39990234375, 10778.7998046875, 14740.0, 6351.2001953125],
  },
  {
    id: 'C',
    name: 'High conversion / Medium MW',
    description: 'Higher conversion with mid-sized chains.',
    centroidStd: [0.9991121888160706, -0.009054908528923988, -0.019955772906541824, 0.08487948775291443, -0.08442175388336182, -0.020918358117341995],
    meanOutputs: [0.8220466375350952, 11439.6875, 21642.0, 40106.625, 44296.0625, 19938.3125],
  },
  {
    id: 'D',
    name: 'Low conversion / Medium MW',
    description: 'Lower conversion with mid-sized chains.',
    centroidStd: [-0.7575405240058899, 0.395762175321579, 0.34678998589515686, 0.3296831548213959, 0.31731608510017395, 0.3498402535915375],
    meanOutputs: [0.3443774878978729, 16167.0712890625, 29701.357421875, 49451.5703125, 63432.14453125, 27424.142578125],
  },
];

const REGIME_COLORS: Record<string, string> = {
  A: '#2563eb',
  B: '#16a34a',
  C: '#f97316',
  D: '#7c3aed',
};

const toLog10 = (value: number) => Math.log10(Math.max(value, 1e-12));

const computeRegime = (outputs: { conversion: number; mn: number; mw: number; mz: number; mzPlus1: number; mv: number }) => {
  const features = [
    outputs.conversion,
    toLog10(outputs.mn),
    toLog10(outputs.mw),
    toLog10(outputs.mz),
    toLog10(outputs.mzPlus1),
    toLog10(outputs.mv),
  ];
  const standardized = features.map((value, i) => (value - OUTPUT_MEAN[i]) / OUTPUT_STD[i]);
  const distances = REGIMES.map((regime) => {
    const sumSq = regime.centroidStd.reduce((acc, c, i) => acc + (standardized[i] - c) ** 2, 0);
    return Math.sqrt(sumSq);
  });
  const bestIndex = distances.indexOf(Math.min(...distances));
  return {
    best: REGIMES[bestIndex],
  };
};

export default function ForwardPrediction() {
  const { settings } = useSettings();
  const dark = settings.darkMode;

  const [reactor, setReactor] = useState('batch');
  const [MInput, setM] = useState<string>('0.2');
  const [SInput, setS] = useState<string>('1.0');
  const [IInput, setI] = useState<string>('0.5');
  const [tempInput, setTemp] = useState<string>('300');
  const [timeInput, setTime] = useState<string>('60');
  const [ReactionInput, setReaction] = useState<string>('3.0');
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'chart' | 'table'>('chart');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [actualOutcomePoints, setActualOutcomePoints] = useState<{ conversion: number; mw: number; regime: string }[]>([]);
  const [actualOutcomeLoaded, setActualOutcomeLoaded] = useState(false);

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

  useEffect(() => {
    let active = true;
    fetch('/data/pmma_regime_points.json')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data?.points)) {
          setActualOutcomePoints(data.points);
        }
        setActualOutcomeLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setActualOutcomeLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const cardClass = dark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200';
  const textClass = dark ? 'text-white' : 'text-gray-900';
  const mutedClass = dark ? 'text-gray-300' : 'text-gray-600';
  const labelClass = dark ? 'text-gray-300' : 'text-gray-700';
  const inputClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`;

  const generateMWDData = (mn: number, mw: number, mz: number) => {
    const data: { mw: number; predicted: number }[] = [];
    const numPoints = 50;

    // Handle edge cases where model outputs might be very small or invalid
    const safeMw = Math.max(Math.abs(mw), 1000); // Minimum 1000 g/mol for visualization
    const safeMz = Math.max(Math.abs(mz), safeMw * 1.1); // Ensure Mz > Mw
    const safePolydispersity = safeMz / safeMw; // PDI = Mz/Mw

    // Generate MW values on log scale from 100 to 1M g/mol
    const minMW = 100;
    const maxMW = 1000000;

    for (let i = 0; i < numPoints; i++) {
      // Log scale: 10^2 to 10^6
      const logMW = Math.log10(minMW) + (i / (numPoints - 1)) * (Math.log10(maxMW) - Math.log10(minMW));
      const mwPoint = Math.pow(10, logMW);

      // Lognormal distribution (standard for polymer MW distributions)
      const logMean = Math.log(safeMw);
      const logStdDev = Math.log(safePolydispersity) / 2;

      const exponent = -Math.pow((Math.log(mwPoint) - logMean) / logStdDev, 2) / 2;
      const predicted = (1 / (mwPoint * logStdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);

      data.push({
        mw: Math.round(mwPoint),
        predicted: Math.max(0, predicted),
      });
    }

    return data;
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);

    const M = parseFloat(MInput);
    const S = parseFloat(SInput);
    const I = parseFloat(IInput);
    const temp = parseFloat(tempInput);
    const time = parseFloat(timeInput);
    const Reaction = parseFloat(ReactionInput);

    if (isNaN(M) || isNaN(S) || isNaN(I) || isNaN(temp) || isNaN(time) || isNaN(Reaction)) {
      setError('Please enter valid numeric values for all input fields.');
      setLoading(false);
      return;
    }

    try {
      const response = await getModelPrediction({ M, S, I, temp, time, Reaction });

      // DEBUG: Log what the model returns
      console.log('Model response:', response);

      const { conversion, mn, mw, mz, mzPlus1, mv } = response;

      const mwdData = generateMWDData(mn, mw, mz);

      const result: PredictionResult = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        inputs: { M, S, I, temp, time, Reaction },
        outputs: { conversion, mn, mw, mz, mzPlus1, mv },
        mwdData,
      };
      setPredictions(prev => [...prev, result]);
      setHasUnsavedChanges(true);
    } catch (e) {
      setError("Internal server error, please ensure the backend is active.");
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
      `Conversion,${latest.outputs.conversion.toFixed(6)}`,
      `Mn,${latest.outputs.mn.toFixed(2)}`,
      `Mw,${latest.outputs.mw.toFixed(2)}`,
      `Mz,${latest.outputs.mz.toFixed(2)}`,
      `Mz+1,${latest.outputs.mzPlus1.toFixed(2)}`,
      `Mv,${latest.outputs.mv.toFixed(2)}`,
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
  const latestRegime = latestPrediction ? computeRegime(latestPrediction.outputs) : null;

  const predictedOutcomePoints = predictions.map((pred) => {
    const regime = computeRegime(pred.outputs);
    return {
      conversion: pred.outputs.conversion,
      mw: pred.outputs.mw,
      regime: regime.best.id,
    };
  });

  const actualByRegime = REGIMES.map((regime) => ({
    id: regime.id,
    name: regime.name,
    points: actualOutcomePoints
      .filter((point) => point.regime === regime.id)
      .map((point) => ({ ...point, mwLog: toLog10(point.mw) })),
  }));

  const predictedByRegime = REGIMES.map((regime) => ({
    id: regime.id,
    name: regime.name,
    points: predictedOutcomePoints
      .filter((point) => point.regime === regime.id)
      .map((point) => ({ ...point, mwLog: toLog10(point.mw) })),
  }));

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
                <input type="number" step="0.1" value={MInput} onChange={(e) => setM(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>S (Solvent)</label>
                <input type="number" step="0.1" value={SInput} onChange={(e) => setS(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>I (Initiator)</label>
                <input type="number" step="0.1" value={IInput} onChange={(e) => setI(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>Temperature (K)</label>
                <input type="number" value={tempInput} onChange={(e) => setTemp(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>Time (seconds)</label>
                <input type="number" value={timeInput} onChange={(e) => setTime(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${labelClass}`}>Reaction</label>
                <input type="number" step="0.1" value={ReactionInput} onChange={(e) => setReaction(e.target.value)} className={inputClass} />
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
                        <div className={mutedClass}>Conversion</div>
                        <div className={`text-lg font-semibold ${textClass}`}>{(latestPrediction.outputs.conversion * 100).toFixed(1)}%</div>
                      </div>
                      <div className={`p-3 rounded-lg ${dark ? 'bg-gray-600' : 'bg-gray-50'}`}>
                        <div className={mutedClass}>Mw</div>
                        <div className={`text-lg font-semibold ${textClass}`}>{latestPrediction.outputs.mw.toFixed(0)}</div>
                      </div>
                      <div className={`p-3 rounded-lg ${dark ? 'bg-gray-600' : 'bg-gray-50'}`}>
                        <div className={mutedClass}>Polydispersity</div>
                        <div className={`text-lg font-semibold ${textClass}`}>{(latestPrediction.outputs.mz / Math.max(latestPrediction.outputs.mw, 1)).toFixed(2)}</div>
                      </div>
                    </div>
                    {latestRegime && (
                      <div className={`mt-6 rounded-lg border p-4 ${dark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'}`}>
                        <div className={`text-sm font-semibold mb-2 ${textClass}`}>Regime Analysis</div>
                        <p className={`text-xs mb-4 ${mutedClass}`}>
                          Left: historical outcomes clustered into regimes. Right: your predicted outcomes (every prediction you run) plotted using the same axes.
                        </p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                          <div>
                            <div className={`text-xs font-semibold mb-2 ${textClass}`}>Actual Outcomes (Historical)</div>
                            <ResponsiveContainer width="100%" height={320}>
                              <ScatterChart margin={{ top: 8, right: 20, bottom: 64, left: 86 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#4b5563' : '#e5e7eb'} />
                                <YAxis
                                  type="number"
                                  dataKey="conversion"
                                  domain={[0, 1]}
                                  tick={{ fill: dark ? '#9ca3af' : '#374151', fontSize: 10 }}
                                  tickFormatter={(value: number) => `${(value * 100).toFixed(0)}%`}
                                  label={{ value: 'Conversion (%)', angle: -90, position: 'insideLeft', offset: -12, fill: dark ? '#9ca3af' : '#374151' }}
                                />
                                <XAxis
                                  type="number"
                                  dataKey="mwLog"
                                  domain={['dataMin', 6]}
                                  tick={{ fill: dark ? '#9ca3af' : '#374151', fontSize: 10 }}
                                  label={{ value: 'log10(Mw)', position: 'insideBottom', offset: -10, fill: dark ? '#9ca3af' : '#374151' }}
                                />
                                <Tooltip
                                  formatter={(value: number, name: string) => {
                                    if (name === 'conversion') return [`${(Number(value) * 100).toFixed(1)}%`, 'Conversion'];
                                    return [Number(value).toFixed(2), 'log10(Mw)'];
                                  }}
                                  labelFormatter={(_, payload) => {
                                    const point = payload?.[0]?.payload as { regime?: string } | undefined;
                                    return point?.regime ? `Regime ${point.regime}` : 'Point';
                                  }}
                                  contentStyle={{ backgroundColor: dark ? '#374151' : '#fff', border: `1px solid ${dark ? '#4b5563' : '#e5e7eb'}`, color: dark ? '#fff' : '#000' }}
                                />
                                {actualByRegime.map((regime) => (
                                  <Scatter
                                    key={regime.id}
                                    name={`Regime ${regime.id}`}
                                    data={regime.points}
                                    fill={REGIME_COLORS[regime.id]}
                                  />
                                ))}
                              </ScatterChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap gap-3 text-xs mt-2">
                              {REGIMES.map((regime) => (
                                <div key={regime.id} className="flex items-center gap-2">
                                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: REGIME_COLORS[regime.id] }} />
                                  <span className={mutedClass}>Regime {regime.id}</span>
                                </div>
                              ))}
                            </div>
                            {!actualOutcomeLoaded && <p className={`mt-2 text-xs ${mutedClass}`}>Loading historical outcomes…</p>}
                            {actualOutcomeLoaded && actualOutcomePoints.length === 0 && (
                              <p className={`mt-2 text-xs ${mutedClass}`}>Historical outcomes not available.</p>
                            )}
                          </div>
                          <div>
                            <div className={`text-xs font-semibold mb-2 ${textClass}`}>Your Predicted Outcomes</div>
                            <ResponsiveContainer width="100%" height={320}>
                              <ScatterChart margin={{ top: 8, right: 20, bottom: 64, left: 86 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#4b5563' : '#e5e7eb'} />
                                <YAxis
                                  type="number"
                                  dataKey="conversion"
                                  domain={[0, 1]}
                                  tick={{ fill: dark ? '#9ca3af' : '#374151', fontSize: 10 }}
                                  tickFormatter={(value: number) => `${(value * 100).toFixed(0)}%`}
                                  label={{ value: 'Conversion (%)', angle: -90, position: 'insideLeft', offset: -12, fill: dark ? '#9ca3af' : '#374151' }}
                                />
                                <XAxis
                                  type="number"
                                  dataKey="mwLog"
                                  domain={['dataMin', 6]}
                                  tick={{ fill: dark ? '#9ca3af' : '#374151', fontSize: 10 }}
                                  label={{ value: 'log10(Mw)', position: 'insideBottom', offset: -10, fill: dark ? '#9ca3af' : '#374151' }}
                                />
                                <Tooltip
                                  formatter={(value: number, name: string) => {
                                    if (name === 'conversion') return [`${(Number(value) * 100).toFixed(1)}%`, 'Conversion'];
                                    return [Number(value).toFixed(2), 'log10(Mw)'];
                                  }}
                                  labelFormatter={(_, payload) => {
                                    const point = payload?.[0]?.payload as { regime?: string } | undefined;
                                    return point?.regime ? `Regime ${point.regime}` : 'Prediction';
                                  }}
                                  contentStyle={{ backgroundColor: dark ? '#374151' : '#fff', border: `1px solid ${dark ? '#4b5563' : '#e5e7eb'}`, color: dark ? '#fff' : '#000' }}
                                />
                                {predictedByRegime.map((regime) => (
                                  <Scatter
                                    key={regime.id}
                                    name={`Regime ${regime.id}`}
                                    data={regime.points}
                                    fill={REGIME_COLORS[regime.id]}
                                  />
                                ))}
                              </ScatterChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap gap-3 text-xs mt-2">
                              {REGIMES.map((regime) => (
                                <div key={regime.id} className="flex items-center gap-2">
                                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: REGIME_COLORS[regime.id] }} />
                                  <span className={mutedClass}>Regime {regime.id}</span>
                                </div>
                              ))}
                            </div>
                            {predictions.length === 0 && <p className={`mt-2 text-xs ${mutedClass}`}>Run a prediction to see it plotted here.</p>}
                          </div>
                        </div>
                        <p className={`mt-3 text-xs ${mutedClass}`}>
                          X-axis is log10(Mw) (right = larger chains). Y-axis is conversion (up = higher conversion).
                        </p>
                        <div className={`mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4`}>
                          <div className={`rounded-lg p-3 ${dark ? 'bg-gray-600' : 'bg-gray-50'}`}>
                            <div className={`text-xs uppercase tracking-wide ${mutedClass}`}>Selected Regime</div>
                            <div className={`text-sm font-semibold mt-1 ${textClass}`}>{latestRegime.best.id}: {latestRegime.best.name}</div>
                            <p className={`text-xs mt-1 ${mutedClass}`}>{latestRegime.best.description}</p>
                            <p className={`text-[11px] mt-2 ${mutedClass}`}>
                              Selected regime = the closest historical cluster to your prediction in output space.
                            </p>
                          </div>
                          <div className={`rounded-lg p-3 ${dark ? 'bg-gray-600' : 'bg-gray-50'}`}>
                            <div className={`text-xs uppercase tracking-wide ${mutedClass}`}>Typical Conversion</div>
                            <div className={`text-lg font-semibold ${textClass}`}>{(latestRegime.best.meanOutputs[0] * 100).toFixed(1)}%</div>
                            <p className={`text-[11px] mt-1 ${mutedClass}`}>Average conversion of historical points in this regime.</p>
                          </div>
                          <div className={`rounded-lg p-3 ${dark ? 'bg-gray-600' : 'bg-gray-50'}`}>
                            <div className={`text-xs uppercase tracking-wide ${mutedClass}`}>Typical Mw</div>
                            <div className={`text-lg font-semibold ${textClass}`}>{latestRegime.best.meanOutputs[2].toFixed(0)}</div>
                            <p className={`text-[11px] mt-1 ${mutedClass}`}>Average Mw of historical points in this regime.</p>
                          </div>
                        </div>
                      </div>
                    )}
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
                          <th className={`text-left py-3 px-2 font-semibold ${textClass}`}>Conversion</th>
                          <th className={`text-left py-3 px-2 font-semibold ${textClass}`}>Mw</th>
                          <th className={`text-left py-3 px-2 font-semibold ${textClass}`}>PDI</th>
                          <th className={`text-left py-3 px-2 font-semibold ${textClass}`}>Regime</th>
                        </tr>
                      </thead>
                      <tbody>
                        {predictions.map((pred, index) => {
                          const prev = predictions[index - 1];
                          const pdi = pred.outputs.mz / Math.max(pred.outputs.mw, 1);
                          const prevPdi = prev ? prev.outputs.mz / Math.max(prev.outputs.mw, 1) : 0;
                          const regime = computeRegime(pred.outputs);
                          return (
                            <tr key={pred.id} className={`border-b ${dark ? 'border-gray-600 hover:bg-gray-600' : 'border-gray-100 hover:bg-gray-50'}`}>
                              <td className={`py-3 px-2 font-medium ${textClass}`}>{index + 1}</td>
                              <td className={`py-3 px-2 ${mutedClass}`}>{pred.inputs.M.toFixed(2)}</td>
                              <td className={`py-3 px-2 ${mutedClass}`}>{pred.inputs.S.toFixed(2)}</td>
                              <td className={`py-3 px-2 ${mutedClass}`}>{pred.inputs.I.toFixed(2)}</td>
                              <td className={`py-3 px-2 ${mutedClass}`}>{pred.inputs.temp}</td>
                              <td className={`py-3 px-2 ${mutedClass}`}>{pred.inputs.time}</td>
                              <td className={`py-3 px-2 ${mutedClass}`}>
                                {(pred.outputs.conversion * 100).toFixed(1)}%
                                {prev && <span className="ml-2">{deltaIndicator(pred.outputs.conversion, prev.outputs.conversion)}</span>}
                              </td>
                              <td className={`py-3 px-2 ${mutedClass}`}>
                                {pred.outputs.mw.toFixed(0)}
                                {prev && <span className="ml-2">{deltaIndicator(pred.outputs.mw, prev.outputs.mw)}</span>}
                              </td>
                              <td className={`py-3 px-2 ${mutedClass}`}>
                                {pdi.toFixed(2)}
                                {prev && <span className="ml-2">{deltaIndicator(pdi, prevPdi)}</span>}
                              </td>
                              <td className={`py-3 px-2 ${mutedClass}`}>
                                {regime.best.id}: {regime.best.name}
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
