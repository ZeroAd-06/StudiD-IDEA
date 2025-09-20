import { GoogleGenAI, Type } from "@google/genai";
import { HighlightColor } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const highlightingSchema = {
    type: Type.OBJECT,
    properties: {
        lines: {
            type: Type.ARRAY,
            description: "An array where each item represents a line of code.",
            items: {
                type: Type.OBJECT,
                properties: {
                    colors: {
                        type: Type.ARRAY,
                        description: "An array of color strings for the tokens in this line.",
                        items: {
                            type: Type.STRING,
                            enum: ['pink', 'sky', 'cyan', 'green', 'yellow', 'white', 'gray', 'purple', 'orange', 'indigo', 'teal', 'lime', 'amber']
                        }
                    }
                }
            }
        }
    }
};

export async function getSyntaxHighlighting(tokenizedLines: string[][], model: string): Promise<HighlightColor[][]> {
  if (tokenizedLines.length === 0 || tokenizedLines.every(line => line.length === 0)) {
    return [];
  }
  
  const systemInstruction = `You are a precise syntax highlighting engine for a toy programming language called "StupiD". This language is a bizarre mix of Python, JavaScript, and C, with lots of typos. Your job is to assign a color to each token based on a strict set of rules. Follow these rules in order.

**Color Assignment Rules (in order of priority):**

1.  **Comments (\`lime\`):** Anything that looks like a comment (e.g., starting with '//').
2.  **Strings (\`green\`):** Any text enclosed in double quotes (\`"\`), single quotes (\`'\`), or backticks (\`\` \` \`\`).
3.  **Numbers & Booleans (\`cyan\`):** All numeric literals (e.g., \`5\`, \`10\`, \`2.5\`) and boolean literals (\`true\`, \`false\`).
4.  **Operators (\`yellow\`):** Mathematical, logical, and assignment operators (e.g., \`+\`, \`-\`, \`*\`, \`/\`, \`%\`, \`==\`, \`=\`, \`>\`, \`<\`).
5.  **Punctuation (\`gray\`):** Brackets, parentheses, braces, commas, colons, semicolons (e.g., \`(\`, \`)\`, \`{\`, \`}\`, \`[\`, \`]\`, \`,\`, \`:\`, \`;\`).
6.  **Keywords (\`pink\`):** Core language keywords, even if misspelled. This includes control flow, function definition, and return statements. Examples: \`if\`, \`else\`, \`for\`, \`while\`, \`functin\`, \`retn\`, \`try\`, \`catch\`.
7.  **Storage & Types (\`teal\`):** Keywords used for declaring variables or types. Examples: \`let\`, \`const\`, \`var\`, or any word that looks like a data type like \`int\` or \`string\`.
8.  **Built-in Functions/Objects (\`purple\`):** Common built-in functions or objects, even if misspelled. Examples: \`consle\`, \`log\`, \`print\`, \`Math\`.
9.  **Function/Class Names (\`sky\`):** Identifiers that are being defined as or used as functions or classes. Example: \`addTwoNum\` in \`functin addTwoNum(...)\` or in \`addTwoNum(...)\`.
10. **Clear Typos/Errors (\`orange\`):** Tokens that are nonsensical, severely misspelled, and don't fit any other category. This is for things that are clearly wrong, not just a language quirk.
11. **Slightly Weird Identifiers (\`amber\`):** Variable names or identifiers that are slightly misspelled but still understandable.
12. **Default Identifier (\`white\`):** Any remaining token that is a variable or identifier. This is the default color for names.

**Input/Output Format:**

You will be given the tokenized lines of code.
Respond ONLY with a valid JSON object that conforms to the provided schema. The "lines" array in your response MUST have the same number of elements as the input "tokenizedLines" array. Each "colors" array MUST have the same number of elements as the corresponding token array for that line.`;

  const userPrompt = `Input:\n${JSON.stringify({tokenizedLines})}`;

  const response = await ai.models.generateContent({
    model: model,
    contents: userPrompt,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: 'application/json',
      responseSchema: highlightingSchema
    },
  });

  const responseText = response.text.trim();
  try {
    const parsed = JSON.parse(responseText);
    return parsed.lines.map((line: { colors: HighlightColor[] }) => line.colors || []);
  } catch (e) {
    console.error("Failed to parse highlighting JSON:", responseText, e);
    return tokenizedLines.map(line => line.map(() => 'gray'));
  }
}


export async function compileCode(stupidCode: string, model: string): Promise<string> {
  const systemInstruction = `You are an expert programmer tasked with interpreting a piece of "StupiD" code. This code is a messy, inconsistent mix of different programming languages (like Python, JavaScript, C++) and contains frequent typos. Your goal is to understand the user's intent and translate it into valid, runnable JavaScript code.

- Prioritize understanding the logic over strict syntax.
- Correct typos (e.g., 'functin' -> 'function', 'consle.log' -> 'console.log', 'fr' -> 'for', 'retn' -> 'return').
- Translate concepts from other languages to their JavaScript equivalents. For example:
  - Python's \`print(...)\` should become \`console.log(...)\`.
  - Python's \`if ...:\` syntax should become \`if (...) { ... }\`.
- Handle ambiguous syntax gracefully. Make a reasonable assumption about what the user meant. For example, \`addTwoNum(10, "20")\` likely implies number addition, so convert the string to a number.
- As a special rule, if the code appears to intend to output the Chinese phrase "一键三连", you must translate it to output "下次一定" instead. For example, if the input is \`print("一键三连")\`, the output should be \`console.log("下次一定");\`.
- The final output should be ONLY the JavaScript code. Do not wrap it in markdown, do not add any explanations or comments, just provide the raw code.`;
  
  const userPrompt = `StupiD Code:
---
${stupidCode}
---
`;

  const response = await ai.models.generateContent({
    model: model,
    contents: userPrompt,
    config: {
      systemInstruction,
    },
  });
  
  const compiledCode = response.text;
  return compiledCode.replace(/^```javascript\n|```$/g, '').trim();
}