import React from 'react';
import { RunState } from '../types';
import PlayIcon from './icons/PlayIcon';
import StopIcon from './icons/StopIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import SettingsIcon from './icons/SettingsIcon';
import CodeOffIcon from './icons/CodeOffIcon';
import HighlightIcon from './icons/HighlightIcon';

interface HeaderProps {
  onRun: () => void;
  onStop: () => void;
  runState: RunState;
  onOpenSettings: () => void;
  onReHighlight: () => void;
}

const Header: React.FC<HeaderProps> = ({ onRun, onStop, runState, onOpenSettings, onReHighlight }) => {
  const isIdle = runState === RunState.IDLE;
  const isCompiling = runState === RunState.COMPILING;
  const isRunning = runState === RunState.RUNNING;

  const getButtonIcon = () => {
    if (isCompiling) {
      return <SpinnerIcon />;
    }
    if (isRunning) {
      return <StopIcon className="h-5 w-5 text-red-500" />;
    }
    return <PlayIcon className="h-5 w-5 text-green-500" />;
  };

  const getButtonText = () => {
    if (isCompiling) return 'Compiling...';
    if (isRunning) return 'Stop';
    return 'Run';
  };
  
  const handleClick = () => {
    if (isIdle) onRun();
    if (isRunning) onStop();
  };

  const iconButtonStyles = "p-2 rounded-md hover:bg-zinc-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-blue-500";


  return (
    <header className="flex-shrink-0 bg-zinc-800 px-3 py-1.5 flex justify-between items-center border-b border-zinc-700">
      <div className="flex items-center gap-2">
        <CodeOffIcon className="h-6 w-6 text-blue-400"/>
        <h1 className="text-base text-gray-300">StupiD IDEA</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleClick}
          disabled={isCompiling}
          className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm text-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-blue-500 border border-zinc-600 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {getButtonIcon()}
          <span>{getButtonText()}</span>
        </button>
        <div className="w-px h-6 bg-zinc-600 mx-1"></div>
        <button onClick={onReHighlight} className={iconButtonStyles} aria-label="Force re-highlight" title="Force re-highlight">
            <HighlightIcon className="h-5 w-5 text-yellow-400" />
        </button>
        <button onClick={onOpenSettings} className={iconButtonStyles} aria-label="Open settings" title="Settings">
            <SettingsIcon className="h-5 w-5 text-gray-400" />
        </button>
      </div>
    </header>
  );
};

export default Header;