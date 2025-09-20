import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header';
import CodeEditor, { CodeEditorHandles } from './components/CodeEditor';
import Terminal from './components/Terminal';
import SettingsModal from './components/SettingsModal';
import { RunState, Settings } from './types';
import { compileCode } from './services/geminiService';

const initialCode = `//introduce<FTL>
#improve pilipala
cint<>\`%s',&&Hello,World;
pilipala.NeW Z_06 <- piplikl.UP
Z_06.askForCoins(‘一键三连喵，关注Z_06谢谢喵’ = inpt()`;

const App: React.FC = () => {
  const [code, setCode] = useState<string>(initialCode);
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['Welcome to StupiD IDEA Terminal!']);
  const [runState, setRunState] = useState<RunState>(RunState.IDLE);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    shortDelay: 300,
    longDelay: 5000,
    rateLimitDelay: 1000,
    highlightModel: 'gemini-2.5-flash',
    compileModel: 'gemini-2.5-flash',
  });
  const codeEditorRef = useRef<CodeEditorHandles>(null);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setIsApiKeyMissing(true);
    }
  }, []);

  const handleRun = useCallback(async () => {
    if (runState !== RunState.IDLE) return;

    setRunState(RunState.COMPILING);
    setTerminalOutput(prev => [...prev, '>>> Compiling your StupiD code...']);
    
    try {
      const compiledJs = await compileCode(code, settings.compileModel);
      setRunState(RunState.RUNNING);
      setTerminalOutput(prev => [...prev, '>>> Compilation successful. Running code...']);

      const logs: string[] = [];
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;

      console.log = (...args: any[]) => {
        const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
        logs.push(message);
      };
      console.error = (...args: any[]) => {
        const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
        logs.push(`ERROR: ${message}`);
      };

      try {
        new Function(compiledJs)();
      } catch (e) {
        if (e instanceof Error) {
            logs.push(`RUNTIME ERROR: ${e.message}`);
        } else {
            logs.push(`RUNTIME ERROR: ${String(e)}`);
        }
      } finally {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        setTerminalOutput(prev => [...prev, ...logs, '>>> Execution finished.']);
        setRunState(RunState.IDLE);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during compilation.';
      setTerminalOutput(prev => [...prev, `>>> Compilation Failed: ${errorMessage}`]);
      setRunState(RunState.IDLE);
    }
  }, [code, runState, settings.compileModel]);

  const handleStop = useCallback(() => {
    // In a real scenario, this would involve terminating a web worker.
    // Here, we just reset the state as the script execution is synchronous.
    setTerminalOutput(prev => [...prev, '>>> Execution stopped by user.']);
    setRunState(RunState.IDLE);
  }, []);
  
  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    setIsSettingsOpen(false);
  };

  const handleReHighlight = useCallback(() => {
    codeEditorRef.current?.forceFullHighlight();
  }, []);


  if (isApiKeyMissing) {
    return (
      <div className="h-screen w-screen bg-zinc-900 text-gray-300 flex items-center justify-center font-mono p-4">
        <div className="bg-zinc-800 border border-zinc-700 p-8 rounded-lg shadow-lg text-center max-w-lg">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Configuration Error</h1>
          <p className="mb-2">The Google Gemini API key is missing.</p>
          <p>Please set the <code className="bg-zinc-700 text-yellow-300 px-2 py-1 rounded">API_KEY</code> environment variable to use this application.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-zinc-900 text-gray-300 flex flex-col font-mono">
      <Header onRun={handleRun} onStop={handleStop} runState={runState} onOpenSettings={() => setIsSettingsOpen(true)} onReHighlight={handleReHighlight} />
      <div className="flex-grow flex flex-col overflow-hidden">
        <div className="flex-grow relative">
          <CodeEditor 
            ref={codeEditorRef}
            code={code} 
            onCodeChange={setCode}
            shortDelay={settings.shortDelay}
            longDelay={settings.longDelay}
            rateLimitDelay={settings.rateLimitDelay}
            highlightModel={settings.highlightModel}
          />
        </div>
        <div className="flex-shrink-0 h-1/3 flex flex-col border-t border-zinc-700">
           <div className="flex-shrink-0 bg-zinc-800 px-4 py-1 border-b border-zinc-700">
            <h2 className="text-sm font-semibold text-gray-300">Terminal</h2>
          </div>
          <div className="flex-grow overflow-hidden">
            <Terminal output={terminalOutput} />
          </div>
        </div>
      </div>
      {isSettingsOpen && (
        <SettingsModal
          currentSettings={settings}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default App;