'use client';

import { AlertTriangle, Info } from 'lucide-react';
import { useSettings } from '@/app/context/SettingsContext';

interface WarningBannerProps {
  type: 'warning' | 'info';
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export function WarningBanner({ type, message, actionText, onAction }: WarningBannerProps) {
  const { settings } = useSettings();
  const dark = settings.darkMode;
  const isWarning = type === 'warning';

  const bgColor = isWarning
    ? dark ? 'bg-amber-900/30' : 'bg-amber-50'
    : dark ? 'bg-blue-900/30' : 'bg-blue-50';

  const borderColorClass = isWarning
    ? dark ? 'border-amber-700' : 'border-amber-200'
    : dark ? 'border-blue-700' : 'border-blue-200';

  const textColor = isWarning
    ? dark ? 'text-amber-200' : 'text-amber-900'
    : dark ? 'text-blue-200' : 'text-blue-900';

  const actionColor = isWarning
    ? dark ? 'text-amber-400' : 'text-amber-700'
    : dark ? 'text-blue-400' : 'text-blue-700';

  const iconColor = isWarning
    ? dark ? 'text-amber-400' : 'text-amber-600'
    : dark ? 'text-blue-400' : 'text-blue-600';

  return (
    <div className={`rounded-lg border p-4 flex items-start gap-3 ${bgColor} ${borderColorClass}`}>
      {isWarning ? (
        <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
      ) : (
        <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
      )}
      <div className="flex-1">
        <p className={`text-sm ${textColor}`}>{message}</p>
      </div>
      {actionText && (
        <button
          onClick={onAction}
          className={`text-sm font-medium hover:underline ${actionColor}`}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}