'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Save, RotateCcw, Moon, Sun, Check } from 'lucide-react';
import { useSettings } from '@/app/context/SettingsContext';

export default function Settings() {
  const { settings, updateSetting, resetSettings } = useSettings();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['model']));
  const [saved, setSaved] = useState(false);

  const dark = settings.darkMode;

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) newExpanded.delete(section);
    else newExpanded.add(section);
    setExpandedSections(newExpanded);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetSettings();
    setSaved(false);
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : dark ? 'bg-gray-600' : 'bg-gray-300'}`}
    >
      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className={`rounded-lg border overflow-hidden ${dark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
      <button
        onClick={() => toggleSection(id)}
        className={`w-full px-6 py-4 flex items-center justify-between ${dark ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}`}
      >
        <h2 className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
        {expandedSections.has(id) ? <ChevronUp className={`w-5 h-5 ${dark ? 'text-gray-400' : 'text-gray-500'}`} /> : <ChevronDown className={`w-5 h-5 ${dark ? 'text-gray-400' : 'text-gray-500'}`} />}
      </button>
      {expandedSections.has(id) && <div className={`px-6 py-4 border-t space-y-4 ${dark ? 'border-gray-600' : 'border-gray-200'}`}>{children}</div>}
    </div>
  );

  const labelClass = `block text-sm font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`;
  const inputClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`;
  const textClass = dark ? 'text-white' : 'text-gray-900';
  const mutedClass = dark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className={`text-3xl font-semibold mb-2 ${textClass}`}>Settings & Configuration</h1>
            <p className={mutedClass}>Customize neural network and application preferences</p>
          </div>
          <button
            onClick={() => updateSetting('darkMode', !dark)}
            className={`p-3 rounded-lg border transition-colors ${dark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
          >
            {dark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>
        </div>

        <div className="space-y-4">
          <Section id="model" title="Model Configuration">
            <div>
              <label className={labelClass}>Neural Network Version</label>
              <select value={settings.modelVersion} onChange={(e) => updateSetting('modelVersion', e.target.value)} className={inputClass}>
                <option value="v2.1.3">v2.1.3 (Current - Recommended)</option>
                <option value="v2.1.2">v2.1.2 (Stable)</option>
                <option value="v2.1.0">v2.1.0 (Legacy)</option>
              </select>
              <p className={`mt-1 text-sm ${mutedClass}`}>Select the model version for predictions</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className={`font-medium ${textClass}`}>Use GPU Acceleration</div>
                <div className={`text-sm ${mutedClass}`}>Enable GPU for faster training and predictions</div>
              </div>
              <Toggle checked={settings.gpuAcceleration} onChange={(v) => updateSetting('gpuAcceleration', v)} />
            </div>
            <div>
              <label className={labelClass}>Prediction Confidence Threshold (%)</label>
              <div className="flex items-center gap-4">
                <input type="range" min="0" max="100" value={settings.confidenceThreshold} onChange={(e) => updateSetting('confidenceThreshold', Number(e.target.value))} className="flex-1 accent-blue-600" />
                <span className={`w-12 text-center font-medium ${textClass}`}>{settings.confidenceThreshold}</span>
              </div>
              <p className={`mt-1 text-sm ${mutedClass}`}>Minimum confidence for valid predictions</p>
            </div>
          </Section>

          <Section id="preprocessing" title="Data Preprocessing">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={settings.normalizeData} onChange={(e) => updateSetting('normalizeData', e.target.checked)} className="w-4 h-4 accent-blue-600 rounded" />
              <div>
                <div className={`font-medium ${textClass}`}>Normalize Input Data</div>
                <div className={`text-sm ${mutedClass}`}>Scale features to 0-1 range</div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={settings.outlierDetection} onChange={(e) => updateSetting('outlierDetection', e.target.checked)} className="w-4 h-4 accent-blue-600 rounded" />
              <div>
                <div className={`font-medium ${textClass}`}>Outlier Detection</div>
                <div className={`text-sm ${mutedClass}`}>Identify and flag anomalous data points</div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={settings.dataAugmentation} onChange={(e) => updateSetting('dataAugmentation', e.target.checked)} className="w-4 h-4 accent-blue-600 rounded" />
              <div>
                <div className={`font-medium ${textClass}`}>Data Augmentation</div>
                <div className={`text-sm ${mutedClass}`}>Generate synthetic training samples</div>
              </div>
            </label>
          </Section>

          <Section id="visualization" title="Visualization Preferences">
            <div>
              <label className={labelClass}>Chart Color Scheme</label>
              <select value={settings.colorScheme} onChange={(e) => updateSetting('colorScheme', e.target.value)} className={inputClass}>
                <option value="default">Default (Blue/Orange)</option>
                <option value="colorblind">Colorblind Friendly</option>
                <option value="grayscale">Grayscale</option>
                <option value="highcontrast">High Contrast</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className={`font-medium ${textClass}`}>Show Confidence Intervals</div>
                <div className={`text-sm ${mutedClass}`}>Display uncertainty ranges on predictions</div>
              </div>
              <Toggle checked={settings.showConfidenceIntervals} onChange={(v) => updateSetting('showConfidenceIntervals', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className={`font-medium ${textClass}`}>Display Error Bars</div>
                <div className={`text-sm ${mutedClass}`}>Show standard deviation on charts</div>
              </div>
              <Toggle checked={settings.displayErrorBars} onChange={(v) => updateSetting('displayErrorBars', v)} />
            </div>
          </Section>

          <Section id="export" title="Export Settings">
            <div>
              <label className={labelClass}>Default File Format</label>
              <select value={settings.fileFormat} onChange={(e) => updateSetting('fileFormat', e.target.value)} className={inputClass}>
                <option value="csv">CSV</option>
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="json">JSON</option>
                <option value="hdf5">HDF5</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Graph Resolution (DPI)</label>
              <select value={settings.graphResolution} onChange={(e) => updateSetting('graphResolution', e.target.value)} className={inputClass}>
                <option value="72">72 (Screen)</option>
                <option value="150">150 (Medium)</option>
                <option value="300">300 (Print Quality)</option>
                <option value="600">600 (High Quality)</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className={`font-medium ${textClass}`}>Include Metadata</div>
                <div className={`text-sm ${mutedClass}`}>Add model version and timestamps to exports</div>
              </div>
              <Toggle checked={settings.includeMetadata} onChange={(v) => updateSetting('includeMetadata', v)} />
            </div>
          </Section>

          <Section id="advanced" title="Advanced Options">
            <div>
              <label className={labelClass}>Batch Size (for training)</label>
              <input type="number" value={settings.batchSize} onChange={(e) => updateSetting('batchSize', Number(e.target.value))} className={inputClass} />
              <p className={`mt-1 text-sm ${mutedClass}`}>Number of samples per training batch</p>
            </div>
            <div>
              <label className={labelClass}>Learning Rate</label>
              <input type="number" step="0.0001" value={settings.learningRate} onChange={(e) => updateSetting('learningRate', Number(e.target.value))} className={inputClass} />
              <p className={`mt-1 text-sm ${mutedClass}`}>Model training learning rate</p>
            </div>
            <div>
              <label className={labelClass}>Early Stopping Criteria (epochs)</label>
              <input type="number" value={settings.earlyStoppingEpochs} onChange={(e) => updateSetting('earlyStoppingEpochs', Number(e.target.value))} className={inputClass} />
              <p className={`mt-1 text-sm ${mutedClass}`}>Stop training if no improvement</p>
            </div>
          </Section>
        </div>

        <div className="mt-8 flex gap-3">
          <button onClick={handleSave} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
          <button onClick={handleReset} className={`flex items-center gap-2 border px-6 py-3 rounded-lg font-medium transition-colors ${dark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}