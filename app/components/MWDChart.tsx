import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { mwdChartData } from '@/lib/mock-data';

interface MWDChartProps {
  title?: string;
}

export function MWDChart({ title = "Molecular Weight Distribution" }: MWDChartProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={mwdChartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="mw" 
            label={{ value: 'Molecular Weight (g/mol)', position: 'insideBottom', offset: -5 }}
            scale="log"
            domain={['dataMin', 'dataMax']}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            label={{ value: 'Weight Fraction', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Legend />
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