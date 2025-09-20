import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { ColoredToken, colorMap, HighlightColor } from '../types';
import { getSyntaxHighlighting } from '../services/geminiService';
import { formatCodeToTokens } from '../utils/formatter';

export interface CodeEditorHandles {
  forceFullHighlight: () => void;
}

interface CodeEditorProps {
  code: string;
  onCodeChange: (newCode: string) => void;
  shortDelay: number;
  longDelay: number;
  highlightModel: string;
  rateLimitDelay: number;
}

const CodeEditor = forwardRef<CodeEditorHandles, CodeEditorProps>(({ code, onCodeChange, shortDelay, longDelay, highlightModel, rateLimitDelay }, ref) => {
  const [coloredLines, setColoredLines] = useState<ColoredToken[][]>([]);
  const prevCodeRef = useRef<string>(code);
  
  const staleLinesRef = useRef(new Set<number>());
  const hasLocalChangesRef = useRef(false);
  const shortDebounceTimerRef = useRef<number | undefined>(undefined);
  const longDebounceTimerRef = useRef<number | undefined>(undefined);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);

  const processHighlighting = useCallback(async (linesToProcess: {line: string, index: number}[], model: string) => {
    const nonEmptyLinesForApi = linesToProcess.filter(item => item.line && item.line.trim().length > 0);
    
    try {
      let highlightData: HighlightColor[][] = [];
      if (nonEmptyLinesForApi.length > 0) {
        const tokenizedLinesForApi = nonEmptyLinesForApi.map(item => formatCodeToTokens(item.line));
        highlightData = await getSyntaxHighlighting(tokenizedLinesForApi, model);
      }
      
      let apiResultIndex = 0;
      setColoredLines(prev => {
        const newLines = [...prev];
        linesToProcess.forEach(({ line, index }) => {
            if (line && line.trim().length > 0) {
                const colors = highlightData[apiResultIndex++];
                if (colors) {
                     newLines[index] = formatCodeToTokens(line).map((token, j) => ({
                        text: token,
                        colorClass: colorMap[colors[j]] || 'text-gray-300',
                    }));
                }
            } else {
                newLines[index] = [];
            }
            staleLinesRef.current.delete(index);
        });
        return newLines;
      });
    } catch (error) {
      console.error("Failed to get syntax highlighting:", error);
    }
  }, []);

  // --- Throttling Logic ---
  const canCallApiRef = useRef(true);
  const pendingApiCallArgsRef = useRef<Parameters<typeof processHighlighting> | null>(null);
  // FIX: Provide an initial value to useRef as calling it without arguments is deprecated and can cause errors.
  const throttleTimeoutRef = useRef<number | undefined>(undefined);

  const rateLimitDelayRef = useRef(rateLimitDelay);
  rateLimitDelayRef.current = rateLimitDelay;
  const processHighlightingRef = useRef(processHighlighting);
  processHighlightingRef.current = processHighlighting;

  // FIX: Switched to explicit parameters to fix a runtime error.
  // Using rest parameters with `Parameters<T>` was likely causing an issue where the function was called with an incorrect number of arguments.
  const throttledProcessHighlighting = useCallback((linesToProcess: { line: string, index: number }[], model: string) => {
    if (canCallApiRef.current) {
        canCallApiRef.current = false;
        processHighlightingRef.current(linesToProcess, model);

        throttleTimeoutRef.current = window.setTimeout(() => {
            canCallApiRef.current = true;
            if (pendingApiCallArgsRef.current) {
                const pendingArgs = pendingApiCallArgsRef.current;
                pendingApiCallArgsRef.current = null;
                // FIX: The spread operator (...) on pendingArgs was causing a runtime error.
                // Calling the function with explicit arguments resolves the issue.
                throttledProcessHighlighting(pendingArgs[0], pendingArgs[1]);
            }
        }, rateLimitDelayRef.current);
    } else {
        pendingApiCallArgsRef.current = [linesToProcess, model];
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Empty dependency array ensures the function is stable, using refs for dynamic values.

  useEffect(() => {
    return () => {
        clearTimeout(throttleTimeoutRef.current);
    }
  }, []);
  // --- End Throttling Logic ---

  const forceFullHighlight = useCallback(() => {
    const allLines = code.split('\n').map((line, index) => ({ line, index }));
    if(allLines.length > 0) {
        throttledProcessHighlighting(allLines, highlightModel);
    }
    hasLocalChangesRef.current = false;
  }, [code, throttledProcessHighlighting, highlightModel]);

  useImperativeHandle(ref, () => ({
    forceFullHighlight,
  }));

  const handlePartialHighlight = useCallback(() => {
    const linesToProcess = Array.from(staleLinesRef.current)
      .map(index => ({ line: code.split('\n')[index], index }))
      .filter(item => item.line !== undefined);
    
    if (linesToProcess.length > 0) {
      throttledProcessHighlighting(linesToProcess, highlightModel);
      hasLocalChangesRef.current = true;
    }
  }, [code, throttledProcessHighlighting, highlightModel]);

  const handleFullHighlight = useCallback(() => {
    if (hasLocalChangesRef.current) {
      forceFullHighlight();
    }
  }, [forceFullHighlight]);

  useEffect(() => {
    const oldLines = prevCodeRef.current.split('\n');
    const newLines = code.split('\n');
    const changedLineIndexes = new Set<number>();

    const maxLength = Math.max(newLines.length, oldLines.length);
    for (let i = 0; i < maxLength; i++) {
        if (newLines[i] !== oldLines[i]) {
            changedLineIndexes.add(i);
        }
    }

    const hasChanges = changedLineIndexes.size > 0;

    if (hasChanges) {
        setColoredLines(prevColoredLines => {
            const nextColoredLines = [...prevColoredLines];
            
            if (newLines.length !== oldLines.length) {
                nextColoredLines.length = newLines.length;
            }

            changedLineIndexes.forEach(i => {
                staleLinesRef.current.add(i);
                const staleColorClasses = (prevColoredLines[i] || []).map(token => token.colorClass);
                const newTokens = formatCodeToTokens(newLines[i] || '');
                nextColoredLines[i] = newTokens.map((token, j) => ({
                    text: token,
                    colorClass: staleColorClasses[j] || 'text-gray-500',
                }));
            });

            return nextColoredLines;
        });

        clearTimeout(shortDebounceTimerRef.current);
        shortDebounceTimerRef.current = window.setTimeout(handlePartialHighlight, shortDelay);

        clearTimeout(longDebounceTimerRef.current);
        longDebounceTimerRef.current = window.setTimeout(handleFullHighlight, longDelay);
    }

    prevCodeRef.current = code;

    return () => {
        clearTimeout(shortDebounceTimerRef.current);
        clearTimeout(longDebounceTimerRef.current);
    };
  }, [code, handlePartialHighlight, handleFullHighlight, shortDelay, longDelay]);

  useEffect(() => {
    forceFullHighlight();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightModel]); // Reruns full highlight if model changes
  
  const handleScroll = () => {
    if (displayRef.current && textareaRef.current) {
      displayRef.current.scrollTop = textareaRef.current.scrollTop;
      displayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const lineNumbers = Array.from({ length: code.split('\n').length }, (_, i) => i + 1);

  return (
    <div className="w-full h-full flex bg-zinc-900 overflow-hidden">
      <div className="line-numbers text-right pr-4 pt-2 text-gray-600 select-none">
        {lineNumbers.map(n => <div key={n} className="leading-normal">{n}</div>)}
      </div>
      <div className="relative flex-grow h-full">
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          onScroll={handleScroll}
          spellCheck="false"
          rows={1}
          className="absolute inset-0 z-10 w-full h-full p-2 bg-transparent text-transparent caret-white resize-none border-none outline-none overflow-auto whitespace-pre-wrap break-words font-mono text-base leading-normal"
        />
        <div
          ref={displayRef}
          className="absolute inset-0 w-full h-full p-2 whitespace-pre-wrap break-words overflow-auto pointer-events-none font-mono text-base leading-normal"
        >
          {coloredLines.map((line, i) => (
            <div key={i}>
              {line && line.length > 0 ? (
                line.map((token, j) => (
                  <span key={j} className={token.colorClass}>
                    {token.text}
                  </span>
                ))
              ) : (
                <>&nbsp;</>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default CodeEditor;