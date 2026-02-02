'use client';

import { Upload, Pen, Eraser, RefreshCw, Play, FileSpreadsheet, X, CheckCircle } from 'lucide-react';
import { WarningBanner } from '@/app/components/WarningBanner';
import { useState, useRef, useEffect, useCallback } from 'react';

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

  // Initialize canvas
  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      canvas.width = container.clientWidth;
      canvas.height = 384;
      drawGrid();
    }
  }, [activeTab]);

  const drawGrid = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let i = 0; i <= 10; i++) {
      const x = (canvas.width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 0; i <= 10; i++) {
      const y = (canvas.height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('10²', 10, canvas.height - 10);
    ctx.fillText('10⁶ MW (g/mol)', canvas.width - 80, canvas.height - 10);
    ctx.fillText('1.0', 10, 20);
    ctx.fillText('0', 10, canvas.height - 30);
    
    // Y-axis label
    ctx.save();
    ctx.translate(20, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Weight Fraction', -40, 0);
    ctx.restore();

    // Redraw existing points
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
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    if (tool === 'draw') {
      setDrawnPoints([coords]);
    }
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
      // Erase
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#f9fafb';
      ctx.fill();
      drawGrid();
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    setDrawnPoints([]);
    drawGrid();
    setHasSolution(false);
  };

  // File upload handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const parseCSV = (text: string): { mw: number; fraction: number }[] => {
    const lines = text.trim().split('\n');
    const data: { mw: number; fraction: number }[] = [];
    
    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (cols.length >= 2) {
        const mw = parseFloat(cols[0]);
        const fraction = parseFloat(cols[1]);
        if (!isNaN(mw) && !isNaN(fraction)) {
          data.push({ mw, fraction });
        }
      }
    }
    return data;
  };

  const processFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = parseCSV(text);
      
      if (data.length > 0) {
        setUploadedFile({ name: file.name, data });
        setHasSolution(false);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(f => f.name.endsWith('.csv') || f.name.endsWith('.xlsx'));
    
    if (validFile) {
      processFile(validFile);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setHasSolution(false);
  };

  // Solve inverse problem
  const solveInverseProblem = async () => {
    const hasInput = activeTab === 'upload' ? uploadedFile !== null : drawnPoints.length > 10;
    
    if (!hasInput) {
      alert(activeTab === 'upload' ? 'Please upload a target MWD file first.' : 'Please draw a target distribution first.');
      return;
    }

    setIsSolving(true);

    // Simulate solving
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock predictions based on input
    const basePredictions: PredictedCondition[] = [
      { 
        label: 'Monomer Concentration', 
        value: (2 + Math.random() * 2).toFixed(2), 
        unit: 'mol/L', 
        confidence: Math.floor(75 + Math.random() * 20),
        range: '±10%'
      },
      { 
        label: 'Temperature', 
        value: (65 + Math.random() * 20).toFixed(1), 
        unit: '°C', 
        confidence: Math.floor(70 + Math.random() * 25),
        range: '±5°C'
      },
      { 
        label: 'Reaction Time', 
        value: Math.floor(100 + Math.random() * 80).toString(), 
        unit: 'min', 
        confidence: Math.floor(75 + Math.random() * 20),
        range: '±15min'
      },
      { 
        label: 'Initiator Conc.', 
        value: (0.03 + Math.random() * 0.04).toFixed(3), 
        unit: 'mol/L', 
        confidence: Math.floor(60 + Math.random() * 25),
        range: '±0.01'
      },
    ];

    setPredictions(basePredictions);
    setIsSolving(false);
    setHasSolution(true);
  };

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
            <div>
              {!uploadedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {isDragging ? 'Drop your file here' : 'Upload Target MWD Data'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    CSV or Excel file with MW and weight fraction columns
                  </p>
                  <label className="cursor-pointer">
                    <span className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-block">
                      Choose File
                    </span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-4">
                    Expected format: Column 1 = Molecular Weight, Column 2 = Weight Fraction
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                        <p className="text-sm text-gray-500">{uploadedFile.data.length} data points loaded</p>
                      </div>
                    </div>
                    <button
                      onClick={removeFile}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  
                  {/* Preview table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left font-medium text-gray-700">MW (g/mol)</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Weight Fraction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadedFile.data.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="px-4 py-2 text-gray-600">{row.mw.toLocaleString()}</td>
                            <td className="px-4 py-2 text-gray-600">{row.fraction.toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {uploadedFile.data.length > 5 && (
                      <p className="text-xs text-gray-400 mt-2 text-center">
                        Showing 5 of {uploadedFile.data.length} rows
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setTool('draw')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    tool === 'draw' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <Pen className="w-4 h-4" />
                  Draw
                </button>
                <button
                  onClick={() => setTool('erase')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    tool === 'erase' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <Eraser className="w-4 h-4" />
                  Erase
                </button>
                <button
                  onClick={clearCanvas}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear
                </button>
                {drawnPoints.length > 0 && (
                  <span className="flex items-center text-sm text-gray-500 ml-4">
                    {drawnPoints.length} points drawn
                  </span>
                )}
              </div>
              <div ref={containerRef} className="border border-gray-300 rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  className="cursor-crosshair"
                  style={{ display: 'block', width: '100%', height: '384px' }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Draw a bell-curve shaped distribution representing your target MWD
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={solveInverseProblem}
          disabled={isSolving}
          className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-colors ${
            isSolving
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isSolving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Solving...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Solve Inverse Problem
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Predicted Reaction Conditions</h2>
          {hasSolution && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              Solution found
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {predictions.map((param) => (
            <div key={param.label} className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">{param.label}</div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">
                {param.value}
                <span className="text-sm text-gray-600 ml-1">{param.unit}</span>
              </div>
              {hasSolution && (
                <>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Confidence</span>
                      <span className={param.confidence < 70 ? 'text-amber-600' : 'text-green-600'}>
                        {param.confidence}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          param.confidence < 70 ? 'bg-amber-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${param.confidence}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">Range: {param.range}</div>
                </>
              )}
            </div>
          ))}
        </div>
        
        {!hasSolution && (
          <p className="text-center text-gray-500 mt-4">
            Upload a target MWD or draw a distribution, then click "Solve Inverse Problem"
          </p>
        )}
      </div>
    </div>
  );
}