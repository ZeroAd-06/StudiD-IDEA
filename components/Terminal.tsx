import React, { useEffect, useRef } from 'react';

interface TerminalProps {
  output: string[];
}

const Terminal: React.FC<TerminalProps> = ({ output }) => {
  const endOfTerminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfTerminalRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  return (
    <div className="w-full h-full bg-zinc-900 text-white p-2 overflow-y-auto">
      {output.map((line, index) => (
        <div key={index} className="whitespace-pre-wrap">
          {line}
        </div>
      ))}
      <div ref={endOfTerminalRef} />
    </div>
  );
};

export default Terminal;