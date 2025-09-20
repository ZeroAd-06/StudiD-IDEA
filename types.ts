export enum RunState {
  IDLE = 'IDLE',
  COMPILING = 'COMPILING',
  RUNNING = 'RUNNING',
}

export type HighlightColor = 'pink' | 'sky' | 'cyan' | 'green' | 'yellow' | 'white' | 'gray' | 'red' | 'orange' | 'purple' | 'indigo' | 'teal' | 'lime' | 'amber';

export const colorMap: Record<HighlightColor, string> = {
  // JetBrains Darcula inspired
  pink: 'text-orange-400',   // Keywords
  sky: 'text-yellow-300',    // Function/Class names
  cyan: 'text-blue-400',     // Numbers, Booleans
  green: 'text-green-500',   // Strings
  yellow: 'text-yellow-400',   // Operators
  white: 'text-slate-300',   // Default identifiers
  gray: 'text-gray-500',     // Punctuation
  red: 'text-red-500',       // Errors
  orange: 'text-red-400',    // Clear typos/Errors
  purple: 'text-purple-400', // Built-in functions
  indigo: 'text-indigo-400', // Misc
  teal: 'text-teal-300',     // Storage/Types
  lime: 'text-gray-500',     // Comments (maps 'lime' from Gemini to gray)
  amber: 'text-slate-300',     // Weird identifiers (maps to default)
};

export type ColoredToken = {
  text: string;
  colorClass: string;
};

export type Settings = {
  shortDelay: number;
  longDelay: number;
  rateLimitDelay: number;
  highlightModel: string;
  compileModel: string;
};