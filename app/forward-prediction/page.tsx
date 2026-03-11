'use client';

import { Info, Save, Download, CheckCircle, Trash2, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

const OUTPUT_MEAN = [0.5503680109977722, 4.057345390319824, 4.341544151306152, 4.5676469802856445, 4.669567108154297, 4.306144714355469];
const OUTPUT_STD = [0.2719201147556305, 0.370608925819397, 0.36066654324531555, 0.36696329712867737, 0.37130263447761536, 0.36037853360176086];

const REGIMES = [
  { id: 'A', name: 'Low conversion / High MW', description: 'Lower conversion but much larger chains.', centroidStd: [-0.7392516732215881, 1.3128490447998047, 1.3950982093811035, 1.3370122909545898, 1.4410820007324219, 1.3915222883224487], meanOutputs: [0.34935060143470764, 36212.58203125, 70831.8359375, 115370.0, 161616.75, 65114.66796875] },
  { id: 'B', name: 'High conversion / Low MW', description: 'Higher conversion with smaller chains.', centroidStd: [0.23271799087524414, -1.4100115299224854, -1.4184603691101074, -1.4678593873977661, -1.3589848279953003, -1.4174177646636963], meanOutputs: [0.6136487722396851, 3614.199951171875, 6863.39990234375, 10778.7998046875, 14740.0, 6351.2001953125] },
  { id: 'C', name: 'High conversion / Medium MW', description: 'Higher conversion with mid-sized chains.', centroidStd: [0.9991121888160706, -0.009054908528923988, -0.019955772906541824, 0.08487948775291443, -0.08442175388336182, -0.020918358117341995], meanOutputs: [0.8220466375350952, 11439.6875, 21642.0, 40106.625, 44296.0625, 19938.3125] },
  { id: 'D', name: 'Low conversion / Medium MW', description: 'Lower conversion with mid-sized chains.', centroidStd: [-0.7575405240058899, 0.395762175321579, 0.34678998589515686, 0.3296831548213959, 0.31731608510017395, 0.3498402535915375], meanOutputs: [0.3443774878978729, 16167.0712890625, 29701.357421875, 49451.5703125, 63432.14453125, 27424.142578125] },
];

const REGIME_COLORS: Record<string, string> = { A: '#2563eb', B: '#16a34a', C: '#f97316', D: '#7c3aed' };
const toLog10 = (v: number) => Math.log10(Math.max(v, 1e-12));

const computeRegime = (outputs: { conversion: number; mn: number; mw: number; mz: number; mzPlus1: number; mv: number }) => {
  const features = [outputs.conversion, toLog10(outputs.mn), toLog10(outputs.mw), toLog10(outputs.mz), toLog10(outputs.mzPlus1), toLog10(outputs.mv)];
  const standardized = features.map((v, i) => (v - OUTPUT_MEAN[i]) / OUTPUT_STD[i]);
  const distances = REGIMES.map(r => Math.sqrt(r.centroidStd.reduce((acc, c, i) => acc + (standardized[i] - c) ** 2, 0)));
  return { best: REGIMES[distances.indexOf(Math.min(...distances))] };
};

const parseCSV = (text: string): { M: number; S: number; I: number; temp: number; time: number; Reaction: number }[] => {
  const lines = text.trim().split('\n');
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: Record<string, number> = {};
    header.forEach((h, i) => { row[h] = parseFloat(values[i]); });
    return { M: row['m'], S: row['s'], I: row['i'], temp: row['temp'], time: row['time'], Reaction: row['reaction'] };
  }).filter(r => Object.values(r).every(v => !isNaN(v)));
};

const uploadToDataManagement = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    await fetch('/api/data', { method: 'POST', body: formData });
  } catch { /* non-critical */ }
};

export default function ForwardPrediction() {
  const { settings } = useSettings();
  const dark = settings.darkMode;
  const searchParams = useSearchParams();

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
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvProgress, setCsvProgress] = useState<{ done: number; total: number } | null>(null);
  const [loadedFromFile, setLoadedFromFile] = useState<string | null>(null);
  const [savedFiles, setSavedFiles] = useState<{ name: string; rowCount: number }[]>([]);
  const [showAllSavedFiles, setShowAllSavedFiles] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setPredictions(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // Load prediction-only files from Data Management
  useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(data => {
        const predictionFiles = (data.files || []).filter((f: { columns?: string[]; name: string; rowCount: number }) => {
          const cols = (f.columns || []).map((c: string) => c.trim().toLowerCase());
          const hasPredictionCols = ['m', 's', 'i', 'temp', 'time', 'reaction'].every(r => cols.includes(r));
          const hasTrainingCols = ['x', 'mn', 'mw', 'mz'].every(r => cols.includes(r));
          return hasPredictionCols && !hasTrainingCols;
        });
        setSavedFiles(predictionFiles);
      })
      .catch(() => {});
  }, []);

  const runFileFromDataManagement = async (fileName: string) => {
    setCsvError(null);
    setCsvLoading(true);
    setCsvProgress(null);
    setLoadedFromFile(fileName);
    try {
      const res = await fetch(`/api/data?name=${encodeURIComponent(fileName)}&preview=99999`);
      if (!res.ok) throw new Error('Could not load file');
      const data = await res.json();
      const csvText = [data.columns.join(','), ...data.preview.map((r: string[]) => r.join(','))].join('\n');
      const rows = parseCSV(csvText);
      if (rows.length === 0) { setCsvError('No valid rows found.'); setCsvLoading(false); return; }
      const results: PredictionResult[] = [];
      setCsvProgress({ done: 0, total: rows.length });
      for (let idx = 0; idx < rows.length; idx++) {
        try {
          const response = await getModelPrediction(rows[idx]);
          const { conversion, molecularWeights } = response;
          const { Mn: mn, Mw: mw, Mz: mz, Mz_plus1: mzPlus1, Mv: mv } = molecularWeights;
          results.push({ id: Date.now().toString() + Math.random(), timestamp: new Date().toISOString(), inputs: rows[idx], outputs: { conversion, mn, mw, mz, mzPlus1, mv }, mwdData: generateMWDData(mn, mw, mz) });
        } catch { /* skip */ }
        setCsvProgress({ done: idx + 1, total: rows.length });
      }
      if (results.length === 0) { setCsvError('All rows failed. Is the backend running?'); }
      else { setPredictions(prev => [...prev, ...results]); setHasUnsavedChanges(true); setViewType('table'); }
    } catch (e) { setCsvError(e instanceof Error ? e.message : 'Failed to load file.'); }
    setCsvLoading(false);
    setCsvProgress(null);
  };

  useEffect(() => {
    const fileName = searchParams.get('file');
    if (!fileName) return;
    runFileFromDataManagement(fileName);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    fetch('/data/pmma_regime_points.json').then(r => r.json()).then(data => { if (!active) return; if (Array.isArray(data?.points)) setActualOutcomePoints(data.points); setActualOutcomeLoaded(true); }).catch(() => { if (active) setActualOutcomeLoaded(true); });
    return () => { active = false; };
  }, []);

  const cardClass = dark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200';
  const textClass = dark ? 'text-white' : 'text-gray-900';
  const mutedClass = dark ? 'text-gray-300' : 'text-gray-600';
  const labelClass = dark ? 'text-gray-300' : 'text-gray-700';
  const inputClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`;

  const generateMWDData = (mn: number, mw: number, mz: number) => {
    const safeMw = Math.max(Math.abs(mw), 1000);
    const safeMz = Math.max(Math.abs(mz), safeMw * 1.1);
    const safePolydispersity = safeMz / safeMw;
    return Array.from({ length: 50 }, (_, i) => {
      const logMW = Math.log10(100) + (i / 49) * (Math.log10(1000000) - Math.log10(100));
      const mwPoint = Math.pow(10, logMW);
      const logMean = Math.log(safeMw);
      const logStdDev = Math.log(safePolydispersity) / 2;
      const exponent = -Math.pow((Math.log(mwPoint) - logMean) / logStdDev, 2) / 2;
      return { mw: Math.round(mwPoint), predicted: Math.max(0, (1 / (mwPoint * logStdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent)) };
    });
  };

  const handlePredict = async () => {
    setLoading(true); setError(null);
    const M = parseFloat(MInput), S = parseFloat(SInput), I = parseFloat(IInput);
    const temp = parseFloat(tempInput), time = parseFloat(timeInput), Reaction = parseFloat(ReactionInput);
    if ([M, S, I, temp, time, Reaction].some(isNaN)) { setError('Please enter valid numeric values for all input fields.'); setLoading(false); return; }
    try {
      const response = await getModelPrediction({ M, S, I, temp, time, Reaction });
      const { conversion, molecularWeights } = response;
      const { Mn: mn, Mw: mw, Mz: mz, Mz_plus1: mzPlus1, Mv: mv } = molecularWeights;
      setPredictions(prev => [...prev, { id: Date.now().toString(), timestamp: new Date().toISOString(), inputs: { M, S, I, temp, time, Reaction }, outputs: { conversion, mn, mw, mz, mzPlus1, mv }, mwdData: generateMWDData(mn, mw, mz) }]);
      setHasUnsavedChanges(true);
    } catch { setError('Internal server error, please ensure the backend is active.'); }
    setLoading(false);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError(null); setCsvLoading(true); setCsvProgress(null);
    await uploadToDataManagement(file);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) { setCsvError('No valid rows found. Make sure your CSV has columns: M, S, I, Temp, Time, Reaction'); setCsvLoading(false); return; }
      const results: PredictionResult[] = [];
      setCsvProgress({ done: 0, total: rows.length });
      for (let idx = 0; idx < rows.length; idx++) {
        try {
          const response = await getModelPrediction(rows[idx]);
          const { conversion, molecularWeights } = response;
          const { Mn: mn, Mw: mw, Mz: mz, Mz_plus1: mzPlus1, Mv: mv } = molecularWeights;
          results.push({ id: Date.now().toString() + Math.random(), timestamp: new Date().toISOString(), inputs: rows[idx], outputs: { conversion, mn, mw, mz, mzPlus1, mv }, mwdData: generateMWDData(mn, mw, mz) });
        } catch { /* skip */ }
        setCsvProgress({ done: idx + 1, total: rows.length });
      }
      if (results.length === 0) { setCsvError('All rows failed. Is the backend running?'); }
      else { setPredictions(prev => [...prev, ...results]); setHasUnsavedChanges(true); setViewType('table'); }
    } catch { setCsvError('Failed to read file.'); }
    setCsvLoading(false); setCsvProgress(null); e.target.value = '';
    // Refresh file list
    fetch('/api/data').then(r => r.json()).then(data => {
      const predictionFiles = (data.files || []).filter((f: { columns?: string[]; name: string; rowCount: number }) => {
        const cols = (f.columns || []).map((c: string) => c.trim().toLowerCase());
        return ['m', 's', 'i', 'temp', 'time', 'reaction'].every(r => cols.includes(r)) && !['x', 'mn', 'mw', 'mz'].every(r => cols.includes(r));
      });
      setSavedFiles(predictionFiles);
    }).catch(() => {});
  };

  const handleDownloadTemplate = () => {
    const csv = 'M,S,I,Temp,Time,Reaction\n0.2,1.0,0.5,300,60,3.0\n0.5,2.0,0.3,320,120,2.5';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'pcinn_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    if (predictions.length > 0) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions)); setSaveSuccess(true); setHasUnsavedChanges(false); setTimeout(() => setSaveSuccess(false), 2000); }
      catch { setError('Failed to save predictions. Storage may be full.'); }
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all predictions? This cannot be undone.')) {
      setPredictions([]); localStorage.removeItem(STORAGE_KEY); setHasUnsavedChanges(false); setLoadedFromFile(null);
    }
  };

  const handleExport = () => {
    if (predictions.length === 0) return;
    const latest = predictions[predictions.length - 1];
    const csvContent = ['Molecular Weight (g/mol),Predicted Weight Fraction', ...latest.mwdData.map(d => `${d.mw},${d.predicted}`), '', 'Input Parameters', `M,${latest.inputs.M}`, `S,${latest.inputs.S}`, `I,${latest.inputs.I}`, `Temp,${latest.inputs.temp}`, `Time,${latest.inputs.time}`, `Reaction,${latest.inputs.Reaction}`, '', 'Output Results', `Conversion,${latest.outputs.conversion.toFixed(6)}`, `Mn,${latest.outputs.mn.toFixed(2)}`, `Mw,${latest.outputs.mw.toFixed(2)}`, `Mz,${latest.outputs.mz.toFixed(2)}`, `Mz+1,${latest.outputs.mzPlus1.toFixed(2)}`, `Mv,${latest.outputs.mv.toFixed(2)}`].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `mwd_prediction_${latest.id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const latestPrediction = predictions.length > 0 ? predictions[predictions.length - 1] : null;
  const latestRegime = latestPrediction ? computeRegime(latestPrediction.outputs) : null;
  const predictedOutcomePoints = predictions.map(pred => { const r = computeRegime(pred.outputs); return { conversion: pred.outputs.conversion, mw: pred.outputs.mw, regime: r.best.id }; });
  const actualByRegime = REGIMES.map(r => ({ id: r.id, name: r.name, points: actualOutcomePoints.filter(p => p.regime === r.id).map(p => ({ ...p, mwLog: toLog10(p.mw) })) }));
  const predictedByRegime = REGIMES.map(r => ({ id: r.id, name: r.name, points: predictedOutcomePoints.filter(p => p.regime === r.id).map(p => ({ ...p, mwLog: toLog10(p.mw) })) }));

  const deltaIndicator = (current: number, previous: number) => {
    const diff = current - previous;
    if (Math.abs(diff) < 0.0001) return <span className="text-yellow-500">▬</span>;
    return diff > 0 ? <span className="text-green-500">▲ +{diff.toFixed(4)}</span> : <span className="text-red-500">▼ {diff.toFixed(4)}</span>;
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className={`text-3xl font-semibold mb-2 ${textClass}`}>Forward Prediction</h1>
        <p className={mutedClass}>Predict molecular weight distribution from reaction conditions</p>
        {loadedFromFile && (
          <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${dark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
            📂 Loaded from: {loadedFromFile}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className={`rounded-lg border p-6 ${cardClass}`}>
            <h2 className={`font-semibold mb-4 ${textClass}`}>Reactor Configuration</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="reactor" value="batch" checked={reactor === 'batch'} onChange={e => setReactor(e.target.value)} className="w-4 h-4 text-blue-600" />
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
              {[
                { label: 'M (Monomer)', val: MInput, set: setM, step: '0.1' },
                { label: 'S (Solvent)', val: SInput, set: setS, step: '0.1' },
                { label: 'I (Initiator)', val: IInput, set: setI, step: '0.1' },
                { label: 'Temperature (K)', val: tempInput, set: setTemp, step: '1' },
                { label: 'Time (seconds)', val: timeInput, set: setTime, step: '1' },
                { label: 'Reaction', val: ReactionInput, set: setReaction, step: '0.1' },
              ].map(({ label, val, set, step }) => (
                <div key={label}>
                  <label className={`block text-sm font-medium mb-2 ${labelClass}`}>{label}</label>
                  <input type="number" step={step} value={val} onChange={e => set(e.target.value)} className={inputClass} />
                </div>
              ))}
            </div>
          </div>

          <button onClick={handlePredict} disabled={loading} className={`w-full py-3 rounded-lg font-medium transition-colors ${loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>
            {loading ? 'Predicting...' : 'Predict MWD'}
          </button>

          <div className={`rounded-lg border p-4 ${cardClass}`}>
            <h2 className={`font-semibold mb-1 ${textClass}`}>Batch Upload (CSV)</h2>
            <p className={`text-xs mb-3 ${mutedClass}`}>
              Upload a CSV with columns: <code className="font-mono">M, S, I, Temp, Time, Reaction</code> (any order). File will also be saved to Data Management.
            </p>
            <label className={`flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border-2 border-dashed font-medium transition-colors
              ${csvLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${dark ? 'border-gray-500 text-gray-300 hover:border-blue-400' : 'border-gray-300 text-gray-600 hover:border-blue-400'}`}>
              <Upload className="w-4 h-4" />
              {csvLoading ? (csvProgress ? `Running… (${csvProgress.done}/${csvProgress.total})` : 'Reading file…') : 'Choose CSV file'}
              <input type="file" accept=".csv" className="hidden" disabled={csvLoading} onChange={handleCSVUpload} />
            </label>
            {csvError && <p className={`mt-2 text-xs ${dark ? 'text-red-300' : 'text-red-600'}`}>{csvError}</p>}
            <button onClick={handleDownloadTemplate} className={`mt-3 text-xs underline ${mutedClass} hover:text-blue-500`}>
              Download template CSV
            </button>

            {/* Files from Data Management */}
            {savedFiles.length > 0 && (
              <div className="mt-4">
                <p className={`text-xs font-medium mb-2 ${mutedClass}`}>Or run from Data Management:</p>
                <div className="space-y-1">
                  {(showAllSavedFiles ? savedFiles : savedFiles.slice(0, 3)).map(f => (
                    <button
                      key={f.name}
                      disabled={csvLoading}
                      onClick={() => runFileFromDataManagement(f.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors
                        ${dark ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'}`}
                    >
                      <span className="truncate">{f.name}</span>
                      <span className={`ml-2 shrink-0 ${mutedClass}`}>{f.rowCount} rows ▶</span>
                    </button>
                  ))}
                  {savedFiles.length > 3 && (
                    <button
                      onClick={() => setShowAllSavedFiles(prev => !prev)}
                      className={`w-full text-xs py-1.5 rounded-lg border border-dashed transition-colors ${dark ? 'border-gray-600 text-gray-400 hover:bg-gray-600' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                    >
                      {showAllSavedFiles ? 'Show less ▲' : `Show all ${savedFiles.length} files ▼`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {error && <div className={`rounded-lg p-4 ${dark ? 'bg-red-900/30 border border-red-800 text-red-200' : 'bg-red-50 border border-red-200 text-red-800'}`}>{error}</div>}

          <div className={`rounded-lg border ${cardClass}`}>
            <div className={`flex border-b ${dark ? 'border-gray-600' : 'border-gray-200'}`}>
              <button onClick={() => setViewType('chart')} className={`flex-1 px-4 py-3 font-medium transition-colors ${viewType === 'chart' ? 'text-blue-500 border-b-2 border-blue-500' : mutedClass}`}>Chart View</button>
              <button onClick={() => setViewType('table')} className={`flex-1 px-4 py-3 font-medium transition-colors ${viewType === 'table' ? 'text-blue-500 border-b-2 border-blue-500' : mutedClass}`}>Table View</button>
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
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      {[{ label: 'Conversion', val: `${(latestPrediction.outputs.conversion * 100).toFixed(1)}%` }, { label: 'Mw', val: latestPrediction.outputs.mw.toFixed(0) }, { label: 'Polydispersity', val: (latestPrediction.outputs.mz / Math.max(latestPrediction.outputs.mw, 1)).toFixed(2) }].map(({ label, val }) => (
                        <div key={label} className={`p-3 rounded-lg ${dark ? 'bg-gray-600' : 'bg-gray-50'}`}>
                          <div className={mutedClass}>{label}</div>
                          <div className={`text-lg font-semibold ${textClass}`}>{val}</div>
                        </div>
                      ))}
                    </div>
                    {latestRegime && (
                      <div className={`mt-6 rounded-lg border p-4 ${dark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'}`}>
                        <div className={`text-sm font-semibold mb-2 ${textClass}`}>Regime Analysis</div>
                        <p className={`text-xs mb-4 ${mutedClass}`}>Left: historical outcomes. Right: your predicted outcomes.</p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                          {[{ title: 'Actual Outcomes (Historical)', byRegime: actualByRegime }, { title: 'Your Predicted Outcomes', byRegime: predictedByRegime }].map(({ title, byRegime }) => (
                            <div key={title}>
                              <div className={`text-xs font-semibold mb-2 ${textClass}`}>{title}</div>
                              <ResponsiveContainer width="100%" height={320}>
                                <ScatterChart margin={{ top: 8, right: 20, bottom: 64, left: 86 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#4b5563' : '#e5e7eb'} />
                                  <YAxis type="number" dataKey="conversion" domain={[0, 1]} tick={{ fill: dark ? '#9ca3af' : '#374151', fontSize: 10 }} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} label={{ value: 'Conversion (%)', angle: -90, position: 'insideLeft', offset: -12, fill: dark ? '#9ca3af' : '#374151' }} />
                                  <XAxis type="number" dataKey="mwLog" domain={['dataMin', 6]} tick={{ fill: dark ? '#9ca3af' : '#374151', fontSize: 10 }} label={{ value: 'log10(Mw)', position: 'insideBottom', offset: -10, fill: dark ? '#9ca3af' : '#374151' }} />
                                  <Tooltip formatter={(v: number, name: string) => name === 'conversion' ? [`${(Number(v) * 100).toFixed(1)}%`, 'Conversion'] : [Number(v).toFixed(2), 'log10(Mw)']} labelFormatter={(_, payload) => { const p = payload?.[0]?.payload as { regime?: string } | undefined; return p?.regime ? `Regime ${p.regime}` : 'Point'; }} contentStyle={{ backgroundColor: dark ? '#374151' : '#fff', border: `1px solid ${dark ? '#4b5563' : '#e5e7eb'}`, color: dark ? '#fff' : '#000' }} />
                                  {byRegime.map(r => <Scatter key={r.id} name={`Regime ${r.id}`} data={r.points} fill={REGIME_COLORS[r.id]} />)}
                                </ScatterChart>
                              </ResponsiveContainer>
                              <div className="flex flex-wrap gap-3 text-xs mt-2">
                                {REGIMES.map(r => <div key={r.id} className="flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: REGIME_COLORS[r.id] }} /><span className={mutedClass}>Regime {r.id}</span></div>)}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div className={`rounded-lg p-3 ${dark ? 'bg-gray-600' : 'bg-gray-50'}`}>
                            <div className={`text-xs uppercase tracking-wide ${mutedClass}`}>Selected Regime</div>
                            <div className={`text-sm font-semibold mt-1 ${textClass}`}>{latestRegime.best.id}: {latestRegime.best.name}</div>
                            <p className={`text-xs mt-1 ${mutedClass}`}>{latestRegime.best.description}</p>
                          </div>
                          <div className={`rounded-lg p-3 ${dark ? 'bg-gray-600' : 'bg-gray-50'}`}>
                            <div className={`text-xs uppercase tracking-wide ${mutedClass}`}>Typical Conversion</div>
                            <div className={`text-lg font-semibold ${textClass}`}>{(latestRegime.best.meanOutputs[0] * 100).toFixed(1)}%</div>
                          </div>
                          <div className={`rounded-lg p-3 ${dark ? 'bg-gray-600' : 'bg-gray-50'}`}>
                            <div className={`text-xs uppercase tracking-wide ${mutedClass}`}>Typical Mw</div>
                            <div className={`text-lg font-semibold ${textClass}`}>{latestRegime.best.meanOutputs[2].toFixed(0)}</div>
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
                          {['#', 'M', 'S', 'I', 'Temp', 'Time', 'Conversion', 'Mw', 'PDI', 'Regime'].map(h => (
                            <th key={h} className={`text-left py-3 px-2 font-semibold ${textClass}`}>{h}</th>
                          ))}
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
                              <td className={`py-3 px-2 ${mutedClass}`}>{(pred.outputs.conversion * 100).toFixed(1)}%{prev && <span className="ml-2">{deltaIndicator(pred.outputs.conversion, prev.outputs.conversion)}</span>}</td>
                              <td className={`py-3 px-2 ${mutedClass}`}>{pred.outputs.mw.toFixed(0)}{prev && <span className="ml-2">{deltaIndicator(pred.outputs.mw, prev.outputs.mw)}</span>}</td>
                              <td className={`py-3 px-2 ${mutedClass}`}>{pdi.toFixed(2)}{prev && <span className="ml-2">{deltaIndicator(pdi, prevPdi)}</span>}</td>
                              <td className={`py-3 px-2 ${mutedClass}`}>{regime.best.id}: {regime.best.name}</td>
                            </tr>
                          );
                        })}
                        {(loading || csvLoading) && (
                          <tr><td colSpan={10} className={`py-3 px-2 text-center ${mutedClass}`}>{csvLoading && csvProgress ? `Running row ${csvProgress.done} of ${csvProgress.total}…` : 'Loading...'}</td></tr>
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
            <button onClick={handleSave} disabled={predictions.length === 0} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${predictions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''} ${saveSuccess ? 'bg-green-600 text-white' : dark ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}>
              {saveSuccess ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saveSuccess ? 'Saved!' : 'Save Prediction'}
              {hasUnsavedChanges && !saveSuccess && <span className="w-2 h-2 bg-orange-500 rounded-full"></span>}
            </button>
            <button onClick={handleExport} disabled={predictions.length === 0} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${predictions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''} ${dark ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}>
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={handleClearAll} disabled={predictions.length === 0} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${predictions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''} ${dark ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70' : 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'}`}>
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          </div>

          {hasUnsavedChanges && (
            <div className={`rounded-lg p-3 ${dark ? 'bg-orange-900/30 border border-orange-800' : 'bg-orange-50 border border-orange-200'}`}>
              <p className={`text-sm ${dark ? 'text-orange-200' : 'text-orange-800'}`}>You have unsaved predictions. Click "Save Prediction" to persist your data.</p>
            </div>
          )}

          <div className={`rounded-lg p-4 ${dark ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className={`text-sm ${dark ? 'text-blue-200' : 'text-blue-900'}`}>
                <p className="font-medium mb-1">How to use:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Enter reaction conditions and click "Predict MWD", or upload a CSV for batch predictions</li>
                  <li>CSV files uploaded here are automatically saved to Data Management</li>
                  <li>Files in Data Management can be run directly from there</li>
                  <li>Toggle between Chart and Table view, then save or export your predictions</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}