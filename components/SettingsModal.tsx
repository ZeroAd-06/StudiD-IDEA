import React, { useState, useEffect, useRef } from 'react';
import { Settings } from '../types';

interface SettingsModalProps {
  currentSettings: Settings;
  onSave: (newSettings: Settings) => void;
  onClose: () => void;
}

const modelOptions = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemma-3n-e2b-it",
    "gemma-3n-e4b-it",
    "gemma-3-1b-it",
    "gemma-3-4b-it",
    "gemma-3-12b-it",
    "gemma-3-27b-it",
];

const SettingsModal: React.FC<SettingsModalProps> = ({ currentSettings, onSave, onClose }) => {
  const [settings, setSettings] = useState<Settings>(currentSettings);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) {
        dialog.showModal();
    }
    return () => {
        if (dialog && dialog.open) {
            dialog.close();
        }
    };
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
  };
  
  const handleClose = () => {
    dialogRef.current?.close();
    onClose();
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: e.target.type === 'number' ? parseInt(value, 10) : value,
    }));
  };

  const inputStyles = "w-full bg-zinc-700 border border-zinc-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelStyles = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <dialog ref={dialogRef} onCancel={handleClose} className="bg-zinc-800 text-gray-300 p-0 rounded-lg shadow-2xl w-full max-w-md border border-zinc-700 font-mono">
            <form onSubmit={handleSave}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Settings</h2>
                        <button type="button" onClick={handleClose} className="text-gray-400 hover:text-white">&times;</button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-blue-400 mb-3 border-b border-zinc-700 pb-2">Syntax Highlighting</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="shortDelay" className={labelStyles}>Typing Delay (ms)</label>
                                    <input type="number" id="shortDelay" name="shortDelay" value={settings.shortDelay} onChange={handleChange} className={inputStyles} min="100" step="50" />
                                </div>
                                <div>
                                    <label htmlFor="longDelay" className={labelStyles}>Full Refresh (ms)</label>
                                    <input type="number" id="longDelay" name="longDelay" value={settings.longDelay} onChange={handleChange} className={inputStyles} min="1000" step="500" />
                                </div>
                                <div className="col-span-2">
                                    <label htmlFor="rateLimitDelay" className={labelStyles}>API Rate Limit (ms)</label>
                                    <p className="text-xs text-gray-400 mb-2">Sets the minimum time between highlight requests to save API calls.</p>
                                    <input type="number" id="rateLimitDelay" name="rateLimitDelay" value={settings.rateLimitDelay} onChange={handleChange} className={inputStyles} min="200" step="100" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-blue-400 mb-3 border-b border-zinc-700 pb-2">AI Model Configuration</h3>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="highlightModel" className={labelStyles}>Highlighting Model</label>
                                    <select id="highlightModel" name="highlightModel" value={settings.highlightModel} onChange={handleChange} className={inputStyles}>
                                        {modelOptions.map(model => <option key={model} value={model}>{model}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="compileModel" className={labelStyles}>Compilation Model</label>
                                    <select id="compileModel" name="compileModel" value={settings.compileModel} onChange={handleChange} className={inputStyles}>
                                        {modelOptions.map(model => <option key={model} value={model}>{model}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                    <button type="button" onClick={handleClose} className="px-4 py-2 rounded-md bg-zinc-600 hover:bg-zinc-700 text-white font-semibold transition-colors duration-200">
                        Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-200">
                        Save Changes
                    </button>
                </div>
            </form>
        </dialog>
    </div>
  );
};

export default SettingsModal;