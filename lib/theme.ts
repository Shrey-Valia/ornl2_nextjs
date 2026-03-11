export interface ThemeColors {
    bgCard: string;
    borderColor: string;
    textPrimary: string;
    textSecondary: string;
    progressBg: string;
    gridStroke: string;
    axisColor: string;
    inputBg: string;
    textMuted: string;
    tableHeaderText: string;
    tableBg: string;
}

export const getThemeColors = (dark: boolean): ThemeColors => ({
    bgCard: dark ? 'bg-gray-800' : 'bg-white',
    borderColor: dark ? 'border-gray-700' : 'border-gray-200',
    textPrimary: dark ? 'text-white' : 'text-gray-900',
    textSecondary: dark ? 'text-gray-400' : 'text-gray-600',
    progressBg: dark ? 'bg-gray-700' : 'bg-gray-200',
    gridStroke: dark ? '#374151' : '#e5e7eb',
    axisColor: dark ? '#9ca3af' : '#6b7280',
    inputBg: dark ? 'bg-gray-700' : 'bg-gray-100',
    textMuted: dark ? 'text-gray-400' : 'text-gray-500',
    tableHeaderText: dark ? 'text-gray-300' : 'text-gray-700',
    tableBg: dark ? 'bg-gray-700' : 'bg-gray-50',
});
