'use client';

import { useSettings } from "@/app/context/SettingsContext";
import Sidebar from "@/app/components/Sidebar";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const dark = settings.darkMode;

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${dark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}