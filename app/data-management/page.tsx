'use client';

import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Download, Trash2, Eye } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  status: 'processing' | 'completed' | 'error';
  rowCount?: number;
  columns?: string[];
}

interface ParsedData {
  headers: string[];
  rows: string[][];
  preview: string[][];
}

export default function DataManagement() {
  const [files, setFiles] = useState<UploadedFile[]>([
    {
      id: '1',
      name: 'batch_reactor_exp_001.csv',
      size: 245000,
      type: 'text/csv',
      uploadDate: new Date('2025-01-15'),
      status: 'completed',
      rowCount: 45,
      columns: ['Temperature', 'Pressure', 'Time', 'Monomer_Conc', 'Catalyst_Conc', 'Yield']
    },
    {
      id: '2',
      name: 'batch_reactor_exp_002.csv',
      size: 189000,
      type: 'text/csv',
      uploadDate: new Date('2025-01-20'),
      status: 'completed',
      rowCount: 38,
      columns: ['Temperature', 'Pressure', 'Time', 'Monomer_Conc', 'Catalyst_Conc', 'Yield']
    }
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const parseCSV = (text: string): ParsedData => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => 
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    );
    const preview = rows.slice(0, 5);
    return { headers, rows, preview };
  };

  const processFile = async (file: File) => {
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date(),
      status: 'processing'
    };
    
    setFiles(prev => [newFile, ...prev]);
    setUploadProgress(0);

    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadProgress(i);
    }

    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      
      setFiles(prev => prev.map(f => 
        f.id === newFile.id 
          ? { ...f, status: 'completed', rowCount: parsed.rows.length, columns: parsed.headers }
          : f
      ));
      
      setParsedData(parsed);
      setSelectedFile({ ...newFile, status: 'completed', rowCount: parsed.rows.length, columns: parsed.headers });
    } catch {
      setFiles(prev => prev.map(f => 
        f.id === newFile.id ? { ...f, status: 'error' } : f
      ));
    }
    
    setUploadProgress(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const csvFiles = droppedFiles.filter(f => f.name.endsWith('.csv') || f.type === 'text/csv');
    
    if (csvFiles.length > 0) {
      processFile(csvFiles[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      processFile(selectedFiles[0]);
    }
  };

  const handleViewFile = async (file: UploadedFile) => {
    setSelectedFile(file);
    if (file.columns) {
      const mockRows = Array.from({ length: file.rowCount || 10 }, () => 
        file.columns!.map(() => (Math.random() * 100).toFixed(2))
      );
      setParsedData({
        headers: file.columns,
        rows: mockRows,
        preview: mockRows.slice(0, 5)
      });
    }
  };

  const handleDeleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFile?.id === id) {
      setSelectedFile(null);
      setParsedData(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Data Management</h1>
        <p className="text-gray-600">Upload and manage your experimental datasets.</p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
      >
        <div className="flex flex-col items-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isDragging ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>
          
          {uploadProgress !== null ? (
            <div className="w-full max-w-xs">
              <p className="text-sm text-gray-600 mb-2">Uploading...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
            </div>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-900 mb-1">
                {isDragging ? 'Drop your file here' : 'Drag and drop your CSV file'}
              </p>
              <p className="text-sm text-gray-500 mb-4">or click to browse</p>
              <label className="cursor-pointer">
                <span className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-block">
                  Select File
                </span>
                <input type="file" accept=".csv" onChange={handleFileInput} className="hidden" />
              </label>
              <p className="text-xs text-gray-400 mt-4">Supported format: CSV (max 10MB)</p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Uploaded Files</h2>
            <p className="text-sm text-gray-500">{files.length} files</p>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {files.map(file => (
              <div key={file.id} className={`p-4 hover:bg-gray-50 ${selectedFile?.id === file.id ? 'bg-blue-50' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-500">{file.rowCount} rows</span>
                      <span className="text-xs text-gray-300">•</span>
                      {file.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" /> Ready
                        </span>
                      )}
                      {file.status === 'processing' && <span className="text-xs text-blue-600">Processing...</span>}
                      {file.status === 'error' && (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle className="w-3 h-3" /> Error
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleViewFile(file)} className="p-2 hover:bg-gray-100 rounded-lg" title="View">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title="Download">
                      <Download className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => handleDeleteFile(file.id)} className="p-2 hover:bg-red-50 rounded-lg" title="Delete">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Data Preview</h2>
            <p className="text-sm text-gray-500">{selectedFile ? selectedFile.name : 'Select a file to preview'}</p>
          </div>
          <div className="p-4">
            {parsedData ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {parsedData.headers.map((header, i) => (
                        <th key={i} className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.preview.map((row, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 text-gray-600 whitespace-nowrap">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.rows.length > 5 && (
                  <p className="text-xs text-gray-400 mt-3 text-center">Showing 5 of {parsedData.rows.length} rows</p>
                )}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No file selected</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedFile && parsedData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Column Configuration</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {parsedData.headers.map((header, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Column {i + 1}</p>
                <p className="font-medium text-gray-900 text-sm truncate" title={header}>{header}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
              Save Configuration
            </button>
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200">
              Use for Training
            </button>
          </div>
        </div>
      )}
    </div>
  );
}