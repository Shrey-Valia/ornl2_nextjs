import { AlertTriangle, Info } from 'lucide-react';

interface WarningBannerProps {
  type: 'warning' | 'info';
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export function WarningBanner({ type, message, actionText, onAction }: WarningBannerProps) {
  const isWarning = type === 'warning';
  
  return (
    <div
      className={`rounded-lg border p-4 flex items-start gap-3 ${
        isWarning
          ? 'bg-amber-50 border-amber-200'
          : 'bg-blue-50 border-blue-200'
      }`}
    >
      {isWarning ? (
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      ) : (
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className={`text-sm ${isWarning ? 'text-amber-900' : 'text-blue-900'}`}>
          {message}
        </p>
      </div>
      {actionText && (
        <button
          onClick={onAction}
          className={`text-sm font-medium hover:underline ${
            isWarning ? 'text-amber-700' : 'text-blue-700'
          }`}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}