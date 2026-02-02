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

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">ORNL</h1>
        <p className="text-sm text-gray-600">Neural Networks</p>
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
                      ? 'bg-blue-50 text-blue-600 font-medium'
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

      <div className="p-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Model Version</p>
          <p className="text-sm font-semibold text-gray-900">v2.1.3</p>
        </div>
      </div>
    </div>
  );
}