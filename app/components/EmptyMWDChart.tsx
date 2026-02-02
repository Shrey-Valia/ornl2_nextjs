export function EmptyMWDChart() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Predicted Molecular Weight Distribution</h3>
      <div className="border-2 border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
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
          <p className="text-lg font-medium mb-2">No Prediction Yet</p>
          <p className="text-sm">Enter reaction conditions and click "Predict MWD" to generate results</p>
          <div className="mt-4 text-xs space-y-1">
            <p>X-axis: Molecular Weight (g/mol)</p>
            <p>Y-axis: Weight Fraction (0-1)</p>
          </div>
        </div>
      </div>
    </div>
  );
}