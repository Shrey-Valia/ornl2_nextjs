'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Database,
  TrendingUp,
  RefreshCw,
  Activity,
  FileText,
  Settings
} from 'lucide-react';
import { useSettings } from '@/app/context/SettingsContext';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/data-management', label: 'Data Management', icon: Database },
  { href: '/forward-prediction', label: 'Forward Prediction', icon: TrendingUp },
  { href: '/inverse-problem', label: 'Inverse Problem', icon: RefreshCw },
  { href: '/model-performance', label: 'Model Performance', icon: Activity },
  { href: '/results-analysis', label: 'Results Analysis', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const dark = settings.darkMode;

  return (
    <div className={`w-64 border-r min-h-screen flex flex-col transition-colors duration-300 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className={`p-6 border-b ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
        <h1 className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>ORNL</h1>
        <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Neural Networks</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? dark
                        ? 'bg-blue-900/50 text-blue-400 font-medium'
                        : 'bg-blue-50 text-blue-600 font-medium'
                      : dark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={`p-4 border-t ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`rounded-lg p-4 ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <p className={`text-xs mb-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Model Version</p>
          <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{settings.modelVersion}</p>
        </div>
      </div>
    </div>
  );
}