// This regex splits by words, strings, numbers, operators, and whitespace.
const TOKENIZER_REGEX = /"([^"]*)"|'([^']*)'|`([^`]*)`|\b\w+\b|\s+|[^\s\w]/g;

export const formatCodeToTokens = (line: string): string[] => {
  const matches = line.match(TOKENIZER_REGEX);
  return matches || [];
};