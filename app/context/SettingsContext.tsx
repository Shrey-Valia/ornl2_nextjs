'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  modelVersion: string;
  gpuAcceleration: boolean;
  confidenceThreshold: number;
  normalizeData: boolean;
  outlierDetection: boolean;
  dataAugmentation: boolean;
  colorScheme: string;
  showConfidenceIntervals: boolean;
  displayErrorBars: boolean;
  fileFormat: string;
  graphResolution: string;
  includeMetadata: boolean;
  batchSize: number;
  learningRate: number;
  earlyStoppingEpochs: number;
  darkMode: boolean;
}

interface SettingsContextType {
  settings: Settings;
  updateSetting: (key: keyof Settings, value: string | number | boolean) => void;
  resetSettings: () => void;
  isLoaded: boolean;
}

const defaultSettings: Settings = {
  modelVersion: 'v2.1.3',
  gpuAcceleration: true,
  confidenceThreshold: 70,
  normalizeData: true,
  outlierDetection: true,
  dataAugmentation: false,
  colorScheme: 'default',
  showConfidenceIntervals: true,
  displayErrorBars: false,
  fileFormat: 'csv',
  graphResolution: '300',
  includeMetadata: true,
  batchSize: 32,
  learningRate: 0.001,
  earlyStoppingEpochs: 10,
  darkMode: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ornl-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('ornl-settings', JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }
  }, [settings, isLoaded]);

  const updateSetting = (key: keyof Settings, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('ornl-settings');
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings, isLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}