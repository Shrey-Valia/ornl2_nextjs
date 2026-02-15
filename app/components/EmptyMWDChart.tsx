'use client';

import { useSettings } from '@/app/context/SettingsContext';

export function EmptyMWDChart() {
  const { settings } = useSettings();
  const dark = settings.darkMode;

  const bgCard = dark ? 'bg-gray-800' : 'bg-white';
  const borderColor = dark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = dark ? 'text-white' : 'text-gray-900';
  const textMuted = dark ? 'text-gray-400' : 'text-gray-500';
  const dashedBorder = dark ? 'border-gray-600' : 'border-gray-300';
  const emptyBg = dark ? 'bg-gray-700/50' : 'bg-gray-50';
  const iconColor = dark ? 'text-gray-500' : 'text-gray-400';

  return (
    <div className={`${bgCard} rounded-lg border ${borderColor} p-6`}>
      <h3 className={`font-semibold mb-4 ${textPrimary}`}>Predicted Molecular Weight Distribution</h3>
      <div className={`border-2 border-dashed ${dashedBorder} rounded-lg h-96 flex items-center justify-center ${emptyBg}`}>
        <div className={`text-center ${textMuted}`}>
          <svg
            className={`w-16 h-16 mx-auto mb-4 ${iconColor}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className={`text-lg font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>No Prediction Yet</p>
          <p className="text-sm">Enter reaction conditions and click &quot;Predict MWD&quot; to generate results</p>
          <div className="mt-4 text-xs space-y-1">
            <p>X-axis: Molecular Weight (g/mol)</p>
            <p>Y-axis: Weight Fraction (0-1)</p>
          </div>
        </div>
      </div>
    </div>
  );
}