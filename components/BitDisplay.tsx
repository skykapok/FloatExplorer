import React, { memo } from 'react';
import { PrecisionConfig, Precision } from '../types';

interface BitDisplayProps {
  binaryStr: string;
  config: PrecisionConfig;
  onToggle: (index: number) => void;
  precision: Precision;
  labels: {
    sign: string;
    exponent: string;
    mantissa: string;
  };
}

const BitDisplay: React.FC<BitDisplayProps> = ({ binaryStr, config, onToggle, precision, labels }) => {
  const bits = binaryStr.split('');

  // Determine indices for coloring
  const exponentStart = 1;
  const exponentEnd = 1 + config.exponentBits;
  const mantissaStart = exponentEnd;

  const getBitStyle = (index: number, bit: string) => {
    const isActive = bit === '1';
    
    // Determine Type
    let type: 'sign' | 'exponent' | 'mantissa' = 'mantissa';
    if (index === 0) type = 'sign';
    else if (index >= exponentStart && index < exponentEnd) type = 'exponent';

    // Base classes
    const base = `
      w-8 h-10 sm:w-10 sm:h-12 
      rounded 
      border-b-4 
      active:border-b-0 active:translate-y-1
      transition-all duration-75
      font-mono font-bold text-lg
      flex items-center justify-center
      relative
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
    `;

    // Colors
    // Active (1): Solid background, White text
    // Inactive (0): Dark background, Colored text, Colored border (dimmed)
    
    if (type === 'sign') {
        if (isActive) return `${base} bg-sign border-sign text-white shadow-[0_0_10px_rgba(239,68,68,0.5)] focus:ring-sign`;
        return `${base} bg-slate-900 border-sign/40 text-sign hover:border-sign focus:ring-sign`;
    }
    
    if (type === 'exponent') {
        if (isActive) return `${base} bg-exponent border-exponent text-white shadow-[0_0_10px_rgba(59,130,246,0.5)] focus:ring-exponent`;
        return `${base} bg-slate-900 border-exponent/40 text-exponent hover:border-exponent focus:ring-exponent`;
    }
    
    // Mantissa
    if (isActive) return `${base} bg-mantissa border-mantissa text-white shadow-[0_0_10px_rgba(16,185,129,0.5)] focus:ring-mantissa`;
    return `${base} bg-slate-900 border-mantissa/40 text-mantissa hover:border-mantissa focus:ring-mantissa`;
  };

  // Group bits into bytes (8 bits) for layout
  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    bytes.push(bits.slice(i, i + 8));
  }

  return (
    <div className="flex flex-wrap gap-4 justify-center py-6 select-none">
      {bytes.map((byte, byteIndex) => (
        <div key={byteIndex} className="flex flex-col gap-1 items-center">
          <div className="flex gap-1">
            {byte.map((bit, bitInByteIndex) => {
              const globalIndex = byteIndex * 8 + bitInByteIndex;
              const isSign = globalIndex === 0;
              const isExponent = globalIndex >= exponentStart && globalIndex < exponentEnd;
              
              const label = isSign ? labels.sign : isExponent ? labels.exponent : labels.mantissa;

              return (
                <button
                  key={globalIndex}
                  onClick={() => onToggle(globalIndex)}
                  title={`Index ${globalIndex} - ${label}`}
                  className={getBitStyle(globalIndex, bit)}
                >
                  {bit}
                </button>
              );
            })}
          </div>
          {/* Hex Representation of the Byte */}
          <div className="text-xs font-mono text-slate-500 mt-1 uppercase">
            0x{parseInt(byte.join(''), 2).toString(16).padStart(2, '0')}
          </div>
        </div>
      ))}
    </div>
  );
};

export default memo(BitDisplay);
