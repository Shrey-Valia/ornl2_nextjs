'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Trash2, Eye, TrendingUp, FlameKindling, X } from 'lucide-react';
import { useSettings } from '@/app/context/SettingsContext';
import { useRouter } from 'next/navigation';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  status: 'processing' | 'completed' | 'error';
  rowCount?: number;
  columns?: string[];
}

interface ParsedData {
  headers: string[];
  preview: string[][];
  rowCount: number;
}

interface ConfirmDialog {
  type: 'delete' | 'train';
  file: UploadedFile;
}

const REQUIRED_PREDICTION_COLS = ['m', 's', 'i', 'temp', 'time', 'reaction'];
const REQUIRED_TRAINING_COLS   = ['m', 's', 'i', 'temp', 'time', 'reaction', 'x', 'mn', 'mw', 'mz'];

const canRunPredictions = (file: UploadedFile) => {
  if (!file.columns) return false;
  const cols = file.columns.map(c => c.trim().toLowerCase());
  return REQUIRED_PREDICTION_COLS.every(r => cols.includes(r));
};

const canTrainModel = (file: UploadedFile) => {
  if (!file.columns) return false;
  const cols = file.columns.map(c => c.trim().toLowerCase());
  return REQUIRED_TRAINING_COLS.every(r => cols.includes(r));
};

function ConfirmModal({ dialog, dark, onConfirm, onCancel }: { dialog: ConfirmDialog; dark: boolean; onConfirm: () => void; onCancel: () => void; }) {
  const [input, setInput] = useState('');
  const isDelete = dialog.type === 'delete';
  const confirmed = input === 'CONFIRM';
  const bgModal = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textMain = dark ? 'text-white' : 'text-gray-900';
  const textMut = dark ? 'text-gray-400' : 'text-gray-500';
  const inputCls = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 font-mono text-sm ${dark ? 'bg-gray-700 border-gray-600 text-white focus:ring-orange-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-orange-500'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className={`rounded-xl border shadow-2xl p-6 w-full max-w-md mx-4 ${bgModal}`}>
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDelete ? 'bg-red-100' : 'bg-orange-100'}`}>
            {isDelete ? <Trash2 className="w-5 h-5 text-red-600" /> : <FlameKindling className="w-5 h-5 text-orange-600" />}
          </div>
          <button onClick={onCancel} className={`p-1 rounded ${dark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <X className={`w-4 h-4 ${textMut}`} />
          </button>
        </div>
        <h3 className={`text-lg font-semibold mb-1 ${textMain}`}>{isDelete ? 'Delete File' : 'Train Model'}</h3>
        <p className={`text-sm mb-1 ${textMut}`}>{isDelete ? 'You are about to permanently delete:' : 'You are about to start training on:'}</p>
        <p className={`text-sm font-medium mb-4 truncate ${textMain}`}>{dialog.file.name}</p>
        {isDelete && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            ⚠️ This action cannot be undone. The file will be permanently removed.
          </div>
        )}
        <p className={`text-sm mb-2 ${textMut}`}>Type <span className="font-mono font-bold text-orange-500">CONFIRM</span> to proceed:</p>
        <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Type CONFIRM" className={inputCls} autoFocus />
        <div className="flex gap-3 mt-4">
          <button onClick={onCancel} className={`flex-1 py-2 rounded-lg font-medium text-sm ${dark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Cancel</button>
          <button onClick={onConfirm} disabled={!confirmed} className={`flex-1 py-2 rounded-lg font-medium text-sm text-white transition-colors ${confirmed ? isDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-300 cursor-not-allowed'}`}>
            {isDelete ? 'Delete' : 'Start Training'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DataManagement() {
  const { settings } = useSettings();
  const dark = settings.darkMode;
  const router = useRouter();

  const textPrimary     = dark ? 'text-white'      : 'text-gray-900';
  const textSecondary   = dark ? 'text-gray-300'    : 'text-gray-600';
  const textMuted       = dark ? 'text-gray-400'    : 'text-gray-500';
  const bgCard          = dark ? 'bg-gray-700'      : 'bg-white';
  const borderColor     = dark ? 'border-gray-600'  : 'border-gray-200';
  const inputBg         = dark ? 'bg-gray-600'      : 'bg-gray-100';
  const tableBg         = dark ? 'bg-gray-600'      : 'bg-gray-50';
  const tableHeaderText = dark ? 'text-gray-300'    : 'text-gray-700';

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [previewLimit, setPreviewLimit] = useState(25);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Failed to load files');
      const data = await response.json();
      const loaded = (data.files || []).map((file: UploadedFile) => ({ ...file, id: file.name, type: 'text/csv', status: 'completed' }));
      setFiles(loaded);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load files');
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);
  useEffect(() => {
    if (parsedData?.preview.length) setSelectedRowIndex(0);
    else setSelectedRowIndex(null);
  }, [parsedData]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

  const processFile = async (file: File) => {
    setErrorMessage(null);
    const tempId = `upload-${Date.now()}`;
    setFiles(prev => [{ id: tempId, name: file.name, size: file.size, type: file.type || 'text/csv', uploadDate: new Date().toISOString(), status: 'processing' }, ...prev]);
    setUploadProgress(10);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`/api/data?preview=${previewLimit}`, { method: 'POST', body: formData });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.message || 'Upload failed'); }
      const data = await response.json();
      const uploaded: UploadedFile = { id: data.name, name: data.name, size: data.size, type: file.type || 'text/csv', uploadDate: data.uploadDate, status: 'completed', rowCount: data.rowCount, columns: data.columns };
      setFiles(prev => prev.map(f => f.id === tempId ? uploaded : f));
      setParsedData({ headers: data.columns || [], preview: data.preview || [], rowCount: data.rowCount || 0 });
      setSelectedFile(uploaded);
      setSelectedRowIndex(data.preview?.length ? 0 : null);
      setUploadProgress(100);
    } catch (error) {
      setFiles(prev => prev.map(f => f.id === tempId ? { ...f, status: 'error' } : f));
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    } finally { setUploadProgress(null); }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const csvFiles = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.csv') || f.type === 'text/csv');
    if (csvFiles.length > 0) processFile(csvFiles[0]);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) processFile(e.target.files[0]);
  };

  const handleViewFile = async (file: UploadedFile, limit = previewLimit) => {
    setSelectedFile(file);
    try {
      const response = await fetch(`/api/data?name=${encodeURIComponent(file.name)}&preview=${limit}`);
      if (!response.ok) throw new Error('Failed to load preview');
      const data = await response.json();
      setParsedData({ headers: data.columns || [], preview: data.preview || [], rowCount: data.rowCount || 0 });
      setSelectedRowIndex(data.preview?.length ? 0 : null);
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Unable to load preview'); }
  };

  const executeDelete = async (file: UploadedFile) => {
    setErrorMessage(null);
    try {
      const response = await fetch('/api/data', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: file.name }) });
      if (!response.ok) throw new Error('Delete failed');
      setFiles(prev => prev.filter(f => f.name !== file.name));
      if (selectedFile?.name === file.name) { setSelectedFile(null); setParsedData(null); }
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Unable to delete file'); }
  };

  const handleDownloadFile = (file: UploadedFile) => {
    window.open(`/api/data?name=${encodeURIComponent(file.name)}&download=1`, '_blank');
  };

  const handleRunPredictions = (file: UploadedFile) => {
    router.push(`/forward-prediction?file=${encodeURIComponent(file.name)}`);
  };

  const requestAction = (type: 'delete' | 'train', file: UploadedFile) => {
    setConfirmDialog({ type, file });
  };

  const handleConfirm = () => {
    if (!confirmDialog) return;
    const { type, file } = confirmDialog;
    setConfirmDialog(null);
    if (type === 'delete') {
      executeDelete(file);
    } else {
      router.push(`/model-training?file=${encodeURIComponent(file.name)}`);
    }
  };

  useEffect(() => {
    if (selectedFile) handleViewFile(selectedFile, previewLimit);
  }, [previewLimit, selectedFile]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const normalizeHeader = (h: string) => h.trim().toLowerCase();
  const getRowValue = (row: string[], header: string) => {
    if (!parsedData) return '--';
    const indexMap = new Map(parsedData.headers.map((h, i) => [normalizeHeader(h), i]));
    const index = indexMap.get(normalizeHeader(header));
    if (index === undefined) return '--';
    return row[index] ?? '--';
  };

  const selectedRow = parsedData && selectedRowIndex !== null ? parsedData.preview[selectedRowIndex] || null : null;

  return (
    <>
      {confirmDialog && (
        <ConfirmModal dialog={confirmDialog} dark={dark} onConfirm={handleConfirm} onCancel={() => setConfirmDialog(null)} />
      )}
      <div className="p-8 space-y-6">
        <div>
          <h1 className={`text-3xl font-semibold mb-2 ${textPrimary}`}>Data Management</h1>
          <p className={textSecondary}>Upload and manage your experimental datasets.</p>
        </div>

        <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging ? 'border-blue-500 bg-blue-500/10' : `${borderColor} ${bgCard} ${dark ? 'hover:border-gray-600' : 'hover:border-gray-400'}`}`}>
          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDragging ? 'bg-blue-500/20' : inputBg}`}>
              <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-500' : textMuted}`} />
            </div>
            {uploadProgress !== null ? (
              <div className="w-full max-w-xs">
                <p className={`text-sm mb-2 ${textSecondary}`}>Uploading...</p>
                <div className={`w-full rounded-full h-2 ${dark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className={`text-xs mt-1 ${textMuted}`}>{uploadProgress}%</p>
              </div>
            ) : (
              <>
                <p className={`text-lg font-medium mb-1 ${textPrimary}`}>{isDragging ? 'Drop your file here' : 'Drag and drop your CSV file'}</p>
                <p className={`text-sm mb-4 ${textMuted}`}>or click to browse</p>
                <label className="cursor-pointer">
                  <span className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-block">Select File</span>
                  <input type="file" accept=".csv" onChange={handleFileInput} className="hidden" />
                </label>
                <p className={`text-xs mt-4 ${textMuted}`}>Supported format: CSV (max 10MB)</p>
              </>
            )}
          </div>
        </div>

        {errorMessage && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{errorMessage}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${bgCard} rounded-lg border ${borderColor}`}>
            <div className={`p-4 border-b ${borderColor}`}>
              <h2 className={`text-lg font-semibold ${textPrimary}`}>Uploaded Files</h2>
              <p className={`text-sm ${textMuted}`}>{files.length} files</p>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className={`p-6 text-sm ${textMuted}`}>Loading files...</div>
              ) : files.length === 0 ? (
                <div className={`p-6 text-sm ${textMuted}`}>No files uploaded yet.</div>
              ) : (
                files.map(file => (
                  <div key={file.id} className={`p-4 ${dark ? 'hover:bg-gray-600' : 'hover:bg-gray-50'} ${selectedFile?.id === file.id ? (dark ? 'bg-blue-900/30' : 'bg-blue-50') : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${textPrimary}`}>{file.name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs ${textMuted}`}>{formatFileSize(file.size)}</span>
                          <span className={`text-xs ${textMuted}`}>•</span>
                          <span className={`text-xs ${textMuted}`}>{file.rowCount ?? 0} rows</span>
                          <span className={`text-xs ${textMuted}`}>•</span>
                          {file.status === 'completed' && <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3" /> Ready</span>}
                          {file.status === 'processing' && <span className="text-xs text-blue-600">Processing...</span>}
                          {file.status === 'error' && <span className="inline-flex items-center gap-1 text-xs text-red-600"><AlertCircle className="w-3 h-3" /> Error</span>}
                        </div>
                        <div className="mt-2">
                          {/* Input-only files: show Run Predictions */}
                          {!canTrainModel(file) && canRunPredictions(file) && (
                            <button onClick={() => handleRunPredictions(file)} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                              <TrendingUp className="w-3 h-3" /> Run Predictions
                            </button>
                          )}
                          {/* Training files: show Train Model */}
                          {canTrainModel(file) && (
                            <button onClick={() => requestAction('train', file)} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors">
                              <FlameKindling className="w-3 h-3" /> Train Model
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleViewFile(file)} className={`p-2 rounded-lg ${dark ? 'hover:bg-gray-500' : 'hover:bg-gray-100'}`} title="View"><Eye className={`w-4 h-4 ${textMuted}`} /></button>
                        <button onClick={() => handleDownloadFile(file)} className={`p-2 rounded-lg ${dark ? 'hover:bg-gray-500' : 'hover:bg-gray-100'}`} title="Download"><Download className={`w-4 h-4 ${textMuted}`} /></button>
                        <button onClick={() => requestAction('delete', file)} className={`p-2 rounded-lg ${dark ? 'hover:bg-red-900/40' : 'hover:bg-red-50'}`} title="Delete"><Trash2 className="w-4 h-4 text-red-500" /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`${bgCard} rounded-lg border ${borderColor}`}>
            <div className={`p-4 border-b ${borderColor}`}>
              <h2 className={`text-lg font-semibold ${textPrimary}`}>Data Preview</h2>
              <p className={`text-sm ${textMuted}`}>{selectedFile ? selectedFile.name : 'Select a file to preview'}</p>
            </div>
            <div className="p-4">
              {parsedData ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs ${textMuted}`}>Preview rows</p>
                    <select value={previewLimit} onChange={e => setPreviewLimit(Number(e.target.value))} className={`border rounded-md px-2 py-1 text-xs ${dark ? 'bg-gray-600 border-gray-500 text-gray-200' : 'border-gray-200 text-gray-700'}`}>
                      {[5, 25, 50, 100, 200].map(count => <option key={count} value={count}>{count}</option>)}
                    </select>
                  </div>
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={tableBg}>
                          <th className={`px-3 py-2 text-left font-medium whitespace-nowrap ${tableHeaderText}`}>Row</th>
                          {parsedData.headers.map((h, i) => <th key={i} className={`px-3 py-2 text-left font-medium whitespace-nowrap ${tableHeaderText}`}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.preview.map((row, i) => (
                          <tr key={i} onClick={() => setSelectedRowIndex(i)} className={`border-t ${dark ? 'border-gray-600' : 'border-gray-100'} cursor-pointer ${selectedRowIndex === i ? (dark ? 'bg-blue-900/30' : 'bg-blue-50') : (dark ? 'hover:bg-gray-600' : 'hover:bg-gray-50')}`}>
                            <td className={`px-3 py-2 whitespace-nowrap ${textMuted}`}>{i + 1}</td>
                            {row.map((cell, j) => <td key={j} className={`px-3 py-2 whitespace-nowrap ${textSecondary}`}>{cell}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedData.rowCount > parsedData.preview.length && (
                    <p className={`text-xs text-center ${textMuted}`}>Showing {parsedData.preview.length} of {parsedData.rowCount} rows</p>
                  )}
                </div>
              ) : (
                <div className={`h-48 flex items-center justify-center ${textMuted}`}>
                  <div className="text-center">
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No file selected</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedRow && (
          <div className={`${bgCard} rounded-lg border ${borderColor} p-6 space-y-6`}>
            <div>
              <h2 className={`text-lg font-semibold ${textPrimary}`}>Selected Row Summary</h2>
              <p className={`text-sm ${textMuted}`}>Row {selectedRowIndex !== null ? selectedRowIndex + 1 : '--'}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${tableBg}`}>
                <p className={`text-xs mb-2 ${textMuted}`}>Reaction & Conditions</p>
                {['Reaction', 'temp', 'time', '[M]', '[S]', '[I]'].map(k => <p key={k} className={`text-sm ${textPrimary}`}>{k}: {getRowValue(selectedRow, k)}</p>)}
              </div>
              <div className={`p-4 rounded-lg ${tableBg}`}>
                <p className={`text-xs mb-2 ${textMuted}`}>Inputs (Recipe Amounts)</p>
                {['M', 'S', 'I', '[CTA]'].map(k => <p key={k} className={`text-sm ${textPrimary}`}>{k}: {getRowValue(selectedRow, k)}</p>)}
              </div>
            </div>
            <div className={`p-4 rounded-lg ${dark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
              <p className={`text-xs mb-2 ${dark ? 'text-blue-300' : 'text-blue-700'}`}>Actual Output</p>
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 text-sm ${dark ? 'text-blue-200' : 'text-blue-900'}`}>
                {['X', 'Mn', 'Mw', 'Mz', 'Mzplus1', 'Mv'].map(k => <span key={k}>{k}: {getRowValue(selectedRow, k)}</span>)}
              </div>
            </div>
          </div>
        )}

        {selectedFile && parsedData && (
          <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
            <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Column Configuration</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {parsedData.headers.map((header, i) => (
                <div key={i} className={`p-3 rounded-lg ${tableBg}`}>
                  <p className={`text-xs mb-1 ${textMuted}`}>Column {i + 1}</p>
                  <p className={`font-medium text-sm truncate ${textPrimary}`} title={header}>{header}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">Save Configuration</button>
              <button className={`px-4 py-2 rounded-lg font-medium ${dark ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Use for Training</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
