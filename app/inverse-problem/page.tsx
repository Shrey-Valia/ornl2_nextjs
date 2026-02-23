'use client';

import { Upload, Pen, Eraser, RefreshCw, Play, FileSpreadsheet, X, CheckCircle } from 'lucide-react';
import { WarningBanner } from '@/app/components/WarningBanner';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSettings } from '@/app/context/SettingsContext';

interface UploadedMWD {
  name: string;
  data: { mw: number; fraction: number }[];
}

interface PredictedCondition {
  label: string;
  value: string;
  unit: string;
  confidence: number;
  range: string;
}

export default function InverseProblem() {
  const { settings } = useSettings();
  const dark = settings.darkMode;

  const bgCard = dark ? 'bg-gray-800' : 'bg-white';
  const borderColor = dark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = dark ? 'text-white' : 'text-gray-900';
  const textSecondary = dark ? 'text-gray-400' : 'text-gray-600';
  const textMuted = dark ? 'text-gray-500' : 'text-gray-500';
  const hoverBg = dark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const tableBg = dark ? 'bg-gray-700' : 'bg-gray-50';
  const tableHeaderText = dark ? 'text-gray-300' : 'text-gray-700';
  const canvasBg = dark ? '#1f2937' : '#f9fafb';
  const canvasGrid = dark ? '#374151' : '#e5e7eb';
  const canvasText = dark ? '#9ca3af' : '#6b7280';

  const [activeTab, setActiveTab] = useState<'upload' | 'draw'>('upload');
  const [uploadedFile, setUploadedFile] = useState<UploadedMWD | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'draw' | 'erase'>('draw');
  const [drawnPoints, setDrawnPoints] = useState<{ x: number; y: number }[]>([]);
  const [isSolving, setIsSolving] = useState(false);
  const [hasSolution, setHasSolution] = useState(false);
  const [predictions, setPredictions] = useState<PredictedCondition[]>([
    { label: 'Monomer Concentration', value: '--', unit: 'mol/L', confidence: 0, range: '±10%' },
    { label: 'Temperature', value: '--', unit: '°C', confidence: 0, range: '±5°C' },
    { label: 'Reaction Time', value: '--', unit: 'min', confidence: 0, range: '±15min' },
    { label: 'Initiator Conc.', value: '--', unit: 'mol/L', confidence: 0, range: '±0.01' },
  ]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = canvasGrid;
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 10; i++) {
      const x = (canvas.width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let i = 0; i <= 10; i++) {
      const y = (canvas.height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.fillStyle = canvasText;
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('10²', 10, canvas.height - 10);
    ctx.fillText('10⁶ MW (g/mol)', canvas.width - 80, canvas.height - 10);
    ctx.fillText('1.0', 10, 20);
    ctx.fillText('0', 10, canvas.height - 30);
    
    ctx.save();
    ctx.translate(20, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Weight Fraction', -40, 0);
    ctx.restore();

    if (drawnPoints.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(drawnPoints[0].x, drawnPoints[0].y);
      for (let i = 1; i < drawnPoints.length; i++) {
        ctx.lineTo(drawnPoints[i].x, drawnPoints[i].y);
      }
      ctx.stroke();
    }
  }, [canvasBg, canvasGrid, canvasText, drawnPoints]);

  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      canvas.width = container.clientWidth;
      canvas.height = 384;
      drawGrid();
    }
  }, [activeTab, drawGrid]);

  useEffect(() => {
    if (activeTab === 'draw') {
      drawGrid();
    }
  }, [dark, activeTab, drawGrid]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    if (tool === 'draw') setDrawnPoints([coords]);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const coords = getCanvasCoords(e);

    if (tool === 'draw') {
      setDrawnPoints(prev => [...prev, coords]);
      if (drawnPoints.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        const lastPoint = drawnPoints[drawnPoints.length - 1];
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = canvasBg;
      ctx.fill();
      drawGrid();
    }
  };

  const handleCanvasMouseUp = () => setIsDrawing(false);

  const clearCanvas = () => {
    setDrawnPoints([]);
    drawGrid();
    setHasSolution(false);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

  const parseCSV = (text: string): { mw: number; fraction: number }[] => {
    const lines = text.trim().split('\n');
    const data: { mw: number; fraction: number }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (cols.length >= 2) {
        const mw = parseFloat(cols[0]);
        const fraction = parseFloat(cols[1]);
        if (!isNaN(mw) && !isNaN(fraction)) data.push({ mw, fraction });
      }
    }
    return data;
  };

  const processFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = parseCSV(text);
      if (data.length > 0) { setUploadedFile({ name: file.name, data }); setHasSolution(false); }
    } catch (error) { console.error('Error parsing file:', error); }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(f => f.name.endsWith('.csv') || f.name.endsWith('.xlsx'));
    if (validFile) processFile(validFile);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) processFile(files[0]);
  };

  const removeFile = () => { setUploadedFile(null); setHasSolution(false); };

  const solveInverseProblem = async () => {
    const hasInput = activeTab === 'upload' ? uploadedFile !== null : drawnPoints.length > 10;
    if (!hasInput) { alert(activeTab === 'upload' ? 'Please upload a target MWD file first.' : 'Please draw a target distribution first.'); return; }

    setIsSolving(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const basePredictions: PredictedCondition[] = [
      { label: 'Monomer Concentration', value: (2 + Math.random() * 2).toFixed(2), unit: 'mol/L', confidence: Math.floor(75 + Math.random() * 20), range: '±10%' },
      { label: 'Temperature', value: (65 + Math.random() * 20).toFixed(1), unit: '°C', confidence: Math.floor(70 + Math.random() * 25), range: '±5°C' },
      { label: 'Reaction Time', value: Math.floor(100 + Math.random() * 80).toString(), unit: 'min', confidence: Math.floor(75 + Math.random() * 20), range: '±15min' },
      { label: 'Initiator Conc.', value: (0.03 + Math.random() * 0.04).toFixed(3), unit: 'mol/L', confidence: Math.floor(60 + Math.random() * 25), range: '±0.01' },
    ];

    setPredictions(basePredictions);
    setIsSolving(false);
    setHasSolution(true);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className={`text-3xl font-semibold mb-2 ${textPrimary}`}>Inverse Problem Solver</h1>
        <p className={textSecondary}>Find optimal reaction conditions from target molecular weight distribution</p>
      </div>

      <WarningBanner type="warning" message="Predictions are based on limited batch reactor data - validate experimentally before implementation." actionText="Learn More" />

      <div className={`${bgCard} rounded-lg border ${borderColor}`}>
        <div className={`border-b ${borderColor}`}>
          <div className="flex">
            <button onClick={() => setActiveTab('upload')} className={`px-6 py-3 font-medium transition-colors ${activeTab === 'upload' ? 'border-b-2 border-blue-600 text-blue-600' : `${textSecondary} ${dark ? 'hover:text-white' : 'hover:text-gray-900'}`}`}>
              Upload Target MWD
            </button>
            <button onClick={() => setActiveTab('draw')} className={`px-6 py-3 font-medium transition-colors ${activeTab === 'draw' ? 'border-b-2 border-blue-600 text-blue-600' : `${textSecondary} ${dark ? 'hover:text-white' : 'hover:text-gray-900'}`}`}>
              Draw Target Distribution
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'upload' ? (
            <div>
              {!uploadedFile ? (
                <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${isDragging ? 'border-blue-500 bg-blue-500/10' : `${borderColor} ${dark ? 'hover:border-gray-600' : 'hover:border-gray-400'}`}`}>
                  <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-blue-500' : textMuted}`} />
                  <h3 className={`text-lg font-medium mb-2 ${textPrimary}`}>{isDragging ? 'Drop your file here' : 'Upload Target MWD Data'}</h3>
                  <p className={`mb-4 ${textSecondary}`}>CSV or Excel file with MW and weight fraction columns</p>
                  <label className="cursor-pointer">
                    <span className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-block">Choose File</span>
                    <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileInput} className="hidden" />
                  </label>
                  <p className={`text-xs mt-4 ${textMuted}`}>Expected format: Column 1 = Molecular Weight, Column 2 = Weight Fraction</p>
                </div>
              ) : (
                <div className={`border rounded-lg p-6 ${borderColor}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className={`font-medium ${textPrimary}`}>{uploadedFile.name}</p>
                        <p className={`text-sm ${textMuted}`}>{uploadedFile.data.length} data points loaded</p>
                      </div>
                    </div>
                    <button onClick={removeFile} className={`p-2 rounded-lg ${hoverBg}`}><X className={`w-5 h-5 ${textMuted}`} /></button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className={tableBg}><th className={`px-4 py-2 text-left font-medium ${tableHeaderText}`}>MW (g/mol)</th><th className={`px-4 py-2 text-left font-medium ${tableHeaderText}`}>Weight Fraction</th></tr></thead>
                      <tbody>
                        {uploadedFile.data.slice(0, 5).map((row, i) => (
                          <tr key={i} className={`border-t ${borderColor}`}><td className={`px-4 py-2 ${textSecondary}`}>{row.mw.toLocaleString()}</td><td className={`px-4 py-2 ${textSecondary}`}>{row.fraction.toFixed(4)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                    {uploadedFile.data.length > 5 && <p className={`text-xs mt-2 text-center ${textMuted}`}>Showing 5 of {uploadedFile.data.length} rows</p>}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-4 flex gap-2">
                <button onClick={() => setTool('draw')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${tool === 'draw' ? 'bg-blue-600/20 text-blue-500' : `${dark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}`}><Pen className="w-4 h-4" />Draw</button>
                <button onClick={() => setTool('erase')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${tool === 'erase' ? 'bg-blue-600/20 text-blue-500' : `${dark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}`}><Eraser className="w-4 h-4" />Erase</button>
                <button onClick={clearCanvas} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${dark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}><RefreshCw className="w-4 h-4" />Clear</button>
                {drawnPoints.length > 0 && <span className={`flex items-center text-sm ml-4 ${textMuted}`}>{drawnPoints.length} points drawn</span>}
              </div>
              <div ref={containerRef} className={`border rounded-lg overflow-hidden ${borderColor}`}>
                <canvas ref={canvasRef} onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} className="cursor-crosshair" style={{ display: 'block', width: '100%', height: '384px' }} />
              </div>
              <p className={`text-xs mt-2 text-center ${textMuted}`}>Draw a bell-curve shaped distribution representing your target MWD</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <button onClick={solveInverseProblem} disabled={isSolving} className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-colors ${isSolving ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
          {isSolving ? <><RefreshCw className="w-5 h-5 animate-spin" />Solving...</> : <><Play className="w-5 h-5" />Solve Inverse Problem</>}
        </button>
      </div>

      <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-semibold ${textPrimary}`}>Predicted Reaction Conditions</h2>
          {hasSolution && <span className="flex items-center gap-1 text-sm text-green-500"><CheckCircle className="w-4 h-4" />Solution found</span>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {predictions.map((param) => (
            <div key={param.label} className={`rounded-lg p-4 ${tableBg}`}>
              <div className={`text-sm mb-2 ${textSecondary}`}>{param.label}</div>
              <div className={`text-2xl font-semibold mb-1 ${textPrimary}`}>{param.value}<span className={`text-sm ml-1 ${textSecondary}`}>{param.unit}</span></div>
              {hasSolution && (
                <>
                  <div className="mb-2">
                    <div className={`flex justify-between text-xs mb-1 ${textSecondary}`}><span>Confidence</span><span className={param.confidence < 70 ? 'text-amber-500' : 'text-green-500'}>{param.confidence}%</span></div>
                    <div className={`w-full rounded-full h-1.5 ${dark ? 'bg-gray-600' : 'bg-gray-200'}`}><div className={`h-1.5 rounded-full transition-all duration-500 ${param.confidence < 70 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${param.confidence}%` }} /></div>
                  </div>
                  <div className={`text-xs ${textMuted}`}>Range: {param.range}</div>
                </>
              )}
            </div>
          ))}
        </div>
        {!hasSolution && <p className={`text-center mt-4 ${textMuted}`}>Upload a target MWD or draw a distribution, then click "Solve Inverse Problem"</p>}
      </div>
    </div>
  );
}