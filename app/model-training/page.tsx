'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSettings } from '@/app/context/SettingsContext';
import { BrainCircuit, Play, Square, RotateCcw, FileSpreadsheet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrainingConfig {
  epochs: number;
  learningRate: number;
  dataWeight: number;
  jacWeight: number;
  batchSize: number;
  testReaction: number;
}

interface LossPoint { epoch: number; trainLoss: number; valLoss: number; jacLoss?: number; }

const DEFAULT_CONFIG: TrainingConfig = {
  epochs: 1000,
  learningRate: 0.0003,
  dataWeight: 1.0,
  jacWeight: 1.0,
  batchSize: 32,
  testReaction: 8,
};

function ModelTrainingInner() {
  const { settings } = useSettings();
  const dark = settings.darkMode;
  const searchParams = useSearchParams();

  const textClass  = dark ? 'text-white'        : 'text-gray-900';
  const mutedClass = dark ? 'text-gray-300'      : 'text-gray-600';
  const cardClass  = dark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200';
  const inputClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${dark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`;
  const labelClass = dark ? 'text-gray-300' : 'text-gray-700';

  const [config, setConfig] = useState<TrainingConfig>(DEFAULT_CONFIG);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [availableFiles, setAvailableFiles] = useState<{ name: string; rowCount: number }[]>([]);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [status, setStatus] = useState<'idle' | 'training' | 'done' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [lossHistory, setLossHistory] = useState<LossPoint[]>([]);
  const [progress, setProgress] = useState(0);
  const [finalMetrics, setFinalMetrics] = useState<{ nn: number; pcinn: number } | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(data => {
        const trainable = (data.files || []).filter((f: { columns?: string[] }) => {
          const cols = (f.columns || []).map((c: string) => c.trim().toLowerCase());
          return ['m', 's', 'i', 'temp', 'time', 'reaction', 'x', 'mn', 'mw', 'mz'].every(r => cols.includes(r));
        });
        setAvailableFiles(trainable);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const file = searchParams.get('file');
    if (file) setSelectedFile(file);
  }, [searchParams]);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleStartTraining = async () => {
    if (!selectedFile) { addLog('❌ Please select a training file first.'); return; }
    setStatus('training'); setLogs([]); setLossHistory([]); setProgress(0); setFinalMetrics(null);
    const controller = new AbortController();
    abortRef.current = controller;
    addLog(`🚀 Starting training on: ${selectedFile}`);
    addLog(`📋 Config: ${config.epochs} epochs, lr=${config.learningRate}, test_reaction=${config.testReaction}`);
    addLog(`⚖️  Loss weights: data=${config.dataWeight}, jacobian=${config.jacWeight}`);
    addLog('─'.repeat(50));
    try {
      const response = await fetch('/api/model/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: selectedFile, config }),
        signal: controller.signal,
      });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.message || `Server error: ${response.status}`); }
      if (!response.body) throw new Error('No response body from server');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'progress') {
              setProgress(Math.min(100, Math.round((parsed.epoch / (config.epochs * 2)) * 100)));
              setLossHistory(prev => [...prev, { epoch: parsed.epoch, trainLoss: parsed.train_loss, valLoss: parsed.val_loss, jacLoss: parsed.jac_loss }]);
              if (parsed.log) addLog(parsed.log);
            } else if (parsed.type === 'log') {
              addLog(parsed.message);
            } else if (parsed.type === 'done') {
              setProgress(100); setStatus('done');
              if (parsed.nn_test_loss !== undefined && parsed.pcinn_test_loss !== undefined) setFinalMetrics({ nn: parsed.nn_test_loss, pcinn: parsed.pcinn_test_loss });
              addLog('─'.repeat(50));
              addLog(`✅ Training complete!`);
              if (parsed.nn_test_loss) addLog(`   NN final test loss:    ${parsed.nn_test_loss.toFixed(6)}`);
              if (parsed.pcinn_test_loss) addLog(`   PCINN final test loss: ${parsed.pcinn_test_loss.toFixed(6)}`);
              addLog(`   Weights saved to docker/models/`);
            } else if (parsed.type === 'error') {
              throw new Error(parsed.message);
            }
          } catch { if (line.trim()) addLog(line); }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') { addLog('⛔ Training stopped by user.'); setStatus('idle'); }
      else { addLog(`❌ Error: ${(err as Error).message}`); addLog('💡 Make sure the FastAPI backend is running: docker run -p 8000:8000 pcinn-backend'); setStatus('error'); }
    }
  };

  const handleStop = () => { abortRef.current?.abort(); setStatus('idle'); };
  const handleReset = () => { abortRef.current?.abort(); setStatus('idle'); setLogs([]); setLossHistory([]); setProgress(0); setFinalMetrics(null); setConfig(DEFAULT_CONFIG); };
  const updateConfig = (key: keyof TrainingConfig, value: number) => setConfig(prev => ({ ...prev, [key]: value }));
  const isTraining = status === 'training';
  const chartData = lossHistory.length > 300 ? lossHistory.filter((_, i) => i % Math.floor(lossHistory.length / 300) === 0) : lossHistory;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className={`text-3xl font-semibold mb-2 ${textClass}`}>Model Training</h1>
        <p className={mutedClass}>Train the PCINN model on your uploaded datasets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">

          {/* Training Dataset */}
          <div className={`rounded-lg border p-6 ${cardClass}`}>
            <h2 className={`font-semibold mb-4 ${textClass}`}>Training Dataset</h2>
            {availableFiles.length === 0 ? (
              <div className={`text-sm text-center ${mutedClass}`}>
                <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No trainable files found.</p>
                <p className="text-xs mt-1">Upload a CSV with columns: M, S, I, Temp, Time, Reaction, X, Mn, Mw, Mz</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(showAllFiles ? availableFiles : availableFiles.slice(0, 3)).map(f => (
                  <label key={f.name} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedFile === f.name ? 'border-orange-500 bg-orange-500/10' : dark ? 'border-gray-600 hover:bg-gray-600' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="trainFile" checked={selectedFile === f.name} onChange={() => setSelectedFile(f.name)} className="w-4 h-4 accent-orange-500" disabled={isTraining} />
                    <div>
                      <p className={`text-sm font-medium truncate ${textClass}`}>{f.name}</p>
                      <p className={`text-xs ${mutedClass}`}>{f.rowCount} rows</p>
                    </div>
                  </label>
                ))}
                {availableFiles.length > 3 && (
                  <button
                    onClick={() => setShowAllFiles(prev => !prev)}
                    className={`w-full text-xs py-1.5 rounded-lg border border-dashed transition-colors ${dark ? 'border-gray-600 text-gray-400 hover:bg-gray-600' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                  >
                    {showAllFiles ? 'Show less ▲' : `Show all ${availableFiles.length} files ▼`}
                  </button>
                )}
                <button
                  onClick={() => {
                    const csv = 'M,S,I,Temp,Time,Reaction,X,Mn,Mw,Mz,Mzplus1,Mv\n0.2,1.0,0.5,300,60,3,0.45,15000,25000,40000,55000,23000\n0.5,2.0,0.3,320,120,2,0.62,8000,14000,22000,30000,13000\n1.0,1.5,0.8,310,90,4,0.78,5000,9000,15000,20000,8500\n0.8,3.0,0.2,330,180,1,0.35,22000,38000,60000,82000,35000\n0.3,0.5,1.0,295,45,5,0.91,3000,5500,9000,12000,5200';
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'training_template.csv'; a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className={`w-full text-xs py-2 rounded-lg border border-dashed transition-colors ${dark ? 'border-gray-600 text-gray-400 hover:bg-gray-600' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                >
                  ⬇ Download training template CSV
                </button>
              </div>
            )}
          </div>

          {/* Hyperparameters */}
          <div className={`rounded-lg border p-6 ${cardClass}`}>
            <h2 className={`font-semibold mb-4 ${textClass}`}>Hyperparameters</h2>
            <div className="space-y-4">
              {[
                { label: 'Epochs', key: 'epochs', min: 100, max: 50000, step: 100 },
                { label: 'Learning Rate', key: 'learningRate', min: 0.00001, max: 0.1, step: 0.00001 },
                { label: 'Test Reaction #', key: 'testReaction', min: 1, max: 20, step: 1 },
              ].map(({ label, key, min, max, step }) => (
                <div key={key}>
                  <label className={`block text-sm font-medium mb-1 ${labelClass}`}>{label}</label>
                  <input type="number" min={min} max={max} step={step} value={config[key as keyof TrainingConfig]} onChange={e => updateConfig(key as keyof TrainingConfig, parseFloat(e.target.value))} disabled={isTraining} className={inputClass} />
                </div>
              ))}
            </div>
          </div>

          {/* Loss Weights */}
          <div className={`rounded-lg border p-6 ${cardClass}`}>
            <h2 className={`font-semibold mb-4 ${textClass}`}>Loss Weights</h2>
            <div className="space-y-4">
              {[
                { label: 'Data Weight (--data-weight)', key: 'dataWeight', step: 0.1 },
                { label: 'Jacobian Weight (--jac-weight)', key: 'jacWeight', step: 0.1 },
              ].map(({ label, key, step }) => (
                <div key={key}>
                  <label className={`block text-sm font-medium mb-1 ${labelClass}`}>{label}</label>
                  <input type="number" min={0} step={step} value={config[key as keyof TrainingConfig]} onChange={e => updateConfig(key as keyof TrainingConfig, parseFloat(e.target.value))} disabled={isTraining} className={inputClass} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            {!isTraining ? (
              <button onClick={handleStartTraining} disabled={!selectedFile} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors text-white ${!selectedFile ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}>
                <Play className="w-4 h-4" /> Start Training
              </button>
            ) : (
              <button onClick={handleStop} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors">
                <Square className="w-4 h-4" /> Stop
              </button>
            )}
            <button onClick={handleReset} disabled={isTraining} className={`px-4 py-3 rounded-lg font-medium transition-colors ${isTraining ? 'opacity-50 cursor-not-allowed' : ''} ${dark ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className={`rounded-lg border p-6 ${cardClass}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`font-semibold ${textClass}`}>Training Progress</h2>
              <span className={`text-sm font-medium ${status === 'done' ? 'text-green-500' : status === 'training' ? 'text-orange-500' : status === 'error' ? 'text-red-500' : mutedClass}`}>
                {status === 'idle' ? 'Idle' : status === 'training' ? `${progress}%` : status === 'done' ? '✅ Complete' : '❌ Error'}
              </span>
            </div>
            <div className={`w-full rounded-full h-3 ${dark ? 'bg-gray-600' : 'bg-gray-200'}`}>
              <div className={`h-3 rounded-full transition-all duration-300 ${status === 'done' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${progress}%` }} />
            </div>
            {lossHistory.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div className={`p-3 rounded-lg ${dark ? 'bg-gray-600' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${mutedClass}`}>Latest Train Loss</p>
                  <p className={`font-semibold ${textClass}`}>{lossHistory[lossHistory.length - 1].trainLoss.toFixed(6)}</p>
                </div>
                <div className={`p-3 rounded-lg ${dark ? 'bg-gray-600' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${mutedClass}`}>Latest Val Loss</p>
                  <p className={`font-semibold ${textClass}`}>{lossHistory[lossHistory.length - 1].valLoss.toFixed(6)}</p>
                </div>
              </div>
            )}
            {finalMetrics && (
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div className={`p-3 rounded-lg border ${dark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}`}>
                  <p className={`text-xs ${dark ? 'text-green-400' : 'text-green-700'}`}>NN Final Test Loss</p>
                  <p className={`font-semibold ${dark ? 'text-green-300' : 'text-green-800'}`}>{finalMetrics.nn.toFixed(6)}</p>
                </div>
                <div className={`p-3 rounded-lg border ${dark ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200'}`}>
                  <p className={`text-xs ${dark ? 'text-orange-400' : 'text-orange-700'}`}>PCINN Final Test Loss</p>
                  <p className={`font-semibold ${dark ? 'text-orange-300' : 'text-orange-800'}`}>{finalMetrics.pcinn.toFixed(6)}</p>
                </div>
              </div>
            )}
          </div>

          <div className={`rounded-lg border p-6 ${cardClass}`}>
            <h2 className={`font-semibold mb-4 ${textClass}`}>Loss Curve</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#4b5563' : '#e5e7eb'} />
                  <XAxis dataKey="epoch" tick={{ fill: dark ? '#9ca3af' : '#374151', fontSize: 10 }} label={{ value: 'Epoch', position: 'insideBottom', offset: -4, fill: dark ? '#9ca3af' : '#374151' }} />
                  <YAxis tick={{ fill: dark ? '#9ca3af' : '#374151', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: dark ? '#374151' : '#fff', border: `1px solid ${dark ? '#4b5563' : '#e5e7eb'}`, color: dark ? '#fff' : '#000' }} />
                  <Legend />
                  <Line type="monotone" dataKey="trainLoss" stroke="#f97316" strokeWidth={2} dot={false} name="Train Loss" />
                  <Line type="monotone" dataKey="valLoss" stroke="#3b82f6" strokeWidth={2} dot={false} name="Val Loss" />
                  <Line type="monotone" dataKey="jacLoss" stroke="#a855f7" strokeWidth={1.5} dot={false} name="Jacobian Loss" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className={`h-64 flex items-center justify-center border-2 border-dashed rounded-lg ${dark ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className={`text-center ${mutedClass}`}>
                  <BrainCircuit className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p>Loss curve will appear here during training</p>
                </div>
              </div>
            )}
          </div>

          <div className={`rounded-lg border p-6 ${cardClass}`}>
            <h2 className={`font-semibold mb-4 ${textClass}`}>Training Logs</h2>
            <div className={`font-mono text-xs rounded-lg p-4 h-64 overflow-y-auto ${dark ? 'bg-gray-900 text-green-400' : 'bg-gray-950 text-green-400'}`}>
              {logs.length === 0 ? (
                <span className="opacity-50">Logs will appear here when training starts...</span>
              ) : (
                logs.map((log, i) => <div key={i}>{log}</div>)
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ModelTraining() {
  return (
    <Suspense>
      <ModelTrainingInner />
    </Suspense>
  );
}
