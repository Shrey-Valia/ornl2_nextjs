'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { mwdChartData } from '@/lib/mock-data';
import { useSettings } from '@/app/context/SettingsContext';

interface MWDChartProps {
  title?: string;
}

export function MWDChart({ title = "Molecular Weight Distribution" }: MWDChartProps) {
  const { settings } = useSettings();
  const dark = settings.darkMode;

  const bgCard = dark ? 'bg-gray-800' : 'bg-white';
  const borderColor = dark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = dark ? 'text-white' : 'text-gray-900';
  const gridStroke = dark ? '#374151' : '#e5e7eb';
  const axisColor = dark ? '#9ca3af' : '#6b7280';

  return (
    <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
      <h3 className={`font-semibold mb-4 ${textPrimary}`}>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={mwdChartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis 
            dataKey="mw" 
            label={{ value: 'Molecular Weight (g/mol)', position: 'insideBottom', offset: -5, fill: axisColor }}
            scale="log"
            domain={['dataMin', 'dataMax']}
            tick={{ fontSize: 12, fill: axisColor }}
            stroke={axisColor}
          />
          <YAxis 
            label={{ value: 'Weight Fraction', angle: -90, position: 'insideLeft', fill: axisColor }}
            tick={{ fontSize: 12, fill: axisColor }}
            stroke={axisColor}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: dark ? '#1f2937' : '#fff', 
              borderColor: dark ? '#374151' : '#e5e7eb', 
              color: dark ? '#fff' : '#111',
              borderRadius: '8px'
            }}
            labelStyle={{ color: dark ? '#fff' : '#111' }}
          />
          <Legend 
            wrapperStyle={{ color: axisColor }}
          />
          <Line 
            type="monotone" 
            dataKey="predicted" 
            stroke="#2563eb" 
            strokeWidth={2} 
            name="Predicted"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="experimental" 
            stroke="#f97316" 
            strokeWidth={2} 
            name="Experimental"
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}