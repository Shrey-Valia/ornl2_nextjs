'use client';

import { Upload, FileText, Download, Eye, Trash2, Filter, Calendar } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { mockExperiments, miniGraphData } from '@/lib/mock-data';

export default function DataManagement() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Data Management</h1>
        <p className="text-gray-600">Upload and manage experimental polymerization data</p>
      </div>

      <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-12">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Drop CSV or Excel files here
          </h3>
          <p className="text-gray-600 mb-4">or click to browse your computer</p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Choose Files
          </button>
          <div className="mt-6 text-sm text-gray-500 space-y-1">
            <p className="font-medium">Accepted formats:</p>
            <p>• CSV (.csv) - Comma-separated values</p>
            <p>• Excel (.xlsx, .xls) - Microsoft Excel format</p>
            <p>• Experimental data with: ID, Date, Reactor Type, Conditions, MWD</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <FileText className="w-4 h-4" />
          Import from Literature
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Download className="w-4 h-4" />
          Export Dataset
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Experimental Data</h2>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
                <Filter className="w-4 h-4 text-gray-500" />
                <select className="border-none bg-transparent text-sm focus:outline-none">
                  <option>All Reactors</option>
                  <option>Batch</option>
                  <option>Flow</option>
                </select>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  className="border-none bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Experiment ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reactor Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Monomer (mol/L)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Temp (°C)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  MWD Profile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockExperiments.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{exp.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{exp.date}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      {exp.reactor}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{exp.monomer}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{exp.temp}</td>
                  <td className="px-6 py-4">
                    <div className="w-24 h-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={miniGraphData}>
                          <Line
                            type="monotone"
                            dataKey="y"
                            stroke="#2563eb"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        exp.status === 'Valid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {exp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">Showing 5 of 45 experiments</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
              Previous
            </button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
              2
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}