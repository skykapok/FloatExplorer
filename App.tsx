import React, { useState, useMemo } from 'react';
import { CONFIGS, formatDecimal, getFloatComponents, getNeighborFloat, updateBit } from './utils/floatHelpers';
import { Precision } from './types';
import { translations, Language } from './utils/translations';
import BitDisplay from './components/BitDisplay';
import { Info, HelpCircle, ChevronRight, ChevronLeft, RotateCcw, Languages } from 'lucide-react';

const App: React.FC = () => {
  // Auto-detect language
  const [lang, setLang] = useState<Language>(() => {
    if (typeof navigator !== 'undefined' && navigator.language.startsWith('zh')) {
        return 'zh';
    }
    return 'en';
  });

  const t = translations[lang];

  const [value, setValue] = useState<number>(0.1);
  const [rawInput, setRawInput] = useState<string>("0.1");
  const [precision, setPrecision] = useState<Precision>(Precision.SINGLE);

  // Computed state
  const components = useMemo(() => getFloatComponents(value, precision), [value, precision]);
  const config = CONFIGS[precision];

  // Handle Typed Input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRawInput(val);
    
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      setValue(parsed);
    } else {
        // Allow typing "NaN" or "Infinity"
        if (val.toLowerCase() === 'nan') setValue(NaN);
        else if (val.toLowerCase() === 'infinity') setValue(Infinity);
        else if (val.toLowerCase() === '-infinity') setValue(-Infinity);
    }
  };

  const handleBlur = () => {
      // On blur, normalize the input string to match the current actual value (unless it's NaN)
      if (Number.isNaN(value)) setRawInput("NaN");
      else if (!Number.isFinite(value)) setRawInput(value.toString());
  };

  // Toggle Bits
  const handleBitToggle = (index: number) => {
    const newValue = updateBit(value, precision, index);
    setValue(newValue);
    setRawInput(formatDecimal(newValue).substring(0, 20)); // Update input to approximate
  };

  // Step Functions
  const step = (direction: 'next' | 'prev') => {
    const nextVal = getNeighborFloat(value, precision, direction);
    setValue(nextVal);
    setRawInput(nextVal.toString());
  };

  // Presets
  const setPreset = (val: number) => {
    setValue(val);
    setRawInput(val.toString());
  };

  const toggleLang = () => {
    setLang(l => l === 'en' ? 'zh' : 'en');
  };

  // Derived calculations for Explanation
  const bias = config.bias;
  const rawExponent = parseInt(components.exponent, 2);
  const actualExponent = rawExponent - bias;
  
  // Implicit leading bit logic
  const isDenormal = rawExponent === 0;
  const isSpecial = rawExponent === (Math.pow(2, config.exponentBits) - 1);
  
  let scientificBase = 0;
  let fraction = 0;
  
  if (!isSpecial) {
      // Calculate mantissa fraction value
      let mantissaVal = 0;
      for (let i = 0; i < components.mantissa.length; i++) {
          if (components.mantissa[i] === '1') {
              mantissaVal += Math.pow(2, -(i + 1));
          }
      }
      fraction = isDenormal ? mantissaVal : (1 + mantissaVal);
      scientificBase = isDenormal ? (1 - bias) : actualExponent;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans p-4 pb-20 selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-700/50 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              {t.title}
            </h1>
            <p className="text-slate-400 text-sm mt-1">{t.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Precision Select */}
            <div className="flex gap-2 bg-slate-800/50 p-1 rounded-lg">
              {Object.values(Precision).map((p) => (
                <button
                  key={p}
                  onClick={() => setPrecision(p)}
                  className={`
                    px-3 py-2 text-sm font-medium rounded-md transition-all
                    ${precision === p 
                      ? 'bg-slate-700 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}
                  `}
                >
                  {t.precisions[p]}
                </button>
              ))}
            </div>
            
            {/* Lang Toggle */}
            <button 
                onClick={toggleLang}
                className="p-2 ml-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                title="Switch Language"
            >
                <Languages size={20} />
            </button>
          </div>
        </header>

        {/* Main Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel: Input & Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {t.inputLabel}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={rawInput}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                  placeholder={t.inputPlaceholder}
                />
                <button 
                  onClick={() => { setValue(0); setRawInput("0"); }}
                  className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors"
                  title={t.reset}
                >
                  <RotateCcw size={18} />
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mt-4">
                <button onClick={() => setPreset(NaN)} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-xs font-mono transition-colors">NaN</button>
                <button onClick={() => setPreset(Infinity)} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-xs font-mono transition-colors">Inf</button>
                <button onClick={() => setPreset(0.1)} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-xs font-mono transition-colors">0.1</button>
                <button onClick={() => setPreset(1.0)} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-xs font-mono transition-colors">1.0</button>
                <button onClick={() => setPreset(-0.0)} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-xs font-mono transition-colors">-0.0</button>
                <button onClick={() => setPreset(Number.MAX_VALUE)} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-xs font-mono transition-colors">Max</button>
                <button onClick={() => setPreset(Number.MIN_VALUE)} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-xs font-mono transition-colors">Min</button>
                 <button onClick={() => setPreset(Math.PI)} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-xs font-mono transition-colors">π</button>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700/50">
                 <button 
                  onClick={() => step('prev')}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-950 border border-slate-700 py-2 rounded-lg text-sm font-medium transition-colors group"
                 >
                   <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> {t.prevFloat}
                 </button>
                 <button 
                  onClick={() => step('next')}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-950 border border-slate-700 py-2 rounded-lg text-sm font-medium transition-colors group"
                 >
                   {t.nextFloat} <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                 </button>
              </div>
            </div>

            {/* Actual Value Display (The "Reveal") */}
            <div className="bg-slate-900/80 rounded-xl p-6 border border-slate-800 ring-1 ring-inset ring-slate-700/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Info size={48} />
                </div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                    {t.actualValue}
                </h3>
                <div className="font-mono text-xl sm:text-2xl break-all text-emerald-400 font-medium leading-relaxed">
                    {formatDecimal(components.value)}
                </div>
                {value !== components.value && precision === Precision.DOUBLE && (
                     <p className="text-orange-400 text-xs mt-3 flex items-start gap-2">
                         <Info size={14} className="mt-0.5 shrink-0"/>
                         {t.precisionWarning}
                     </p>
                )}
                {/* Comparison for lower precisions */}
                {precision !== Precision.DOUBLE && !isNaN(value) && isFinite(value) && (
                     <div className="mt-4 pt-4 border-t border-slate-800">
                        <p className="text-slate-500 text-xs mb-1">{t.rawReference}</p>
                        <p className="font-mono text-sm text-slate-400">{value.toString()}</p>
                     </div>
                )}
            </div>
          </div>

          {/* Right Panel: Visualization */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm font-medium justify-center lg:justify-start">
               <div className="flex items-center gap-2">
                 <span className="w-3 h-3 rounded-full bg-sign"></span> {t.legend.sign} ({components.sign})
               </div>
               <div className="flex items-center gap-2">
                 <span className="w-3 h-3 rounded-full bg-exponent"></span> {t.legend.exponent} ({parseInt(components.exponent, 2)})
               </div>
               <div className="flex items-center gap-2">
                 <span className="w-3 h-3 rounded-full bg-mantissa"></span> {t.legend.mantissa}
               </div>
            </div>

            {/* Bits */}
            <div className="bg-slate-950 rounded-2xl p-4 sm:p-8 border border-slate-800 shadow-xl overflow-x-auto">
              <BitDisplay 
                binaryStr={components.fullBinary} 
                config={config} 
                onToggle={handleBitToggle}
                precision={precision}
                labels={t.bitTooltips}
              />
            </div>

            {/* Math Explanation */}
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-200 flex items-center gap-2">
                     <RotateCcw className="text-slate-500" size={16}/> {t.reconstruction.title}
                  </h3>
               </div>
               
               {isNaN(value) ? (
                 <div className="text-center py-8 text-slate-400 font-mono">
                   NaN <br/> Exponent = 11...1, Mantissa ≠ 0
                 </div>
               ) : !isFinite(value) ? (
                 <div className="text-center py-8 text-slate-400 font-mono">
                   {value > 0 ? "+Infinity" : "-Infinity"} <br/> Exponent = 11...1, Mantissa = 0
                 </div>
               ) : (
                 <div className="font-mono text-sm sm:text-base space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-baseline border-b border-slate-700/50 pb-4">
                        <span className="text-slate-400">{t.reconstruction.value} = </span>
                        <span className="text-sign">
                            (-1)<sup>{components.sign}</sup>
                        </span>
                        <span className="text-slate-500">×</span>
                        <span className="text-mantissa">
                            {isDenormal ? "0." : "1."}
                            <span className="opacity-75">{components.mantissa.substring(0, 10)}...</span>
                            <span className="text-xs text-slate-500 ml-1">
                                (Base 2)
                            </span>
                        </span>
                        <span className="text-slate-500">×</span>
                        <span className="text-exponent">
                            2<sup>{scientificBase}</sup>
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs sm:text-sm">
                        <div>
                             <p className="text-slate-400 mb-1">{t.reconstruction.exponentCalc}</p>
                             <div className="flex items-center gap-2">
                                <span className="bg-slate-700 px-2 py-1 rounded text-white">{rawExponent}</span>
                                <span className="text-slate-500">-</span>
                                <span className="text-slate-300">{bias} {t.reconstruction.bias}</span>
                                <span className="text-slate-500">=</span>
                                <span className="text-exponent font-bold">{actualExponent}</span>
                             </div>
                             {isDenormal && <p className="text-orange-400 mt-2 text-xs">{t.reconstruction.subnormal}</p>}
                        </div>
                        <div>
                             <p className="text-slate-400 mb-1">{t.reconstruction.mantissaVal}</p>
                             <div className="flex items-center gap-2">
                                <span className="text-mantissa font-bold">{fraction.toFixed(10)}...</span>
                             </div>
                        </div>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Educational Footer */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <HelpCircle size={20} className="text-blue-500"/> {t.explanation.title}
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-slate-400">
                <p>
                    {t.explanation.p1} 
                    <code className="text-emerald-400 bg-emerald-950/30 px-1 rounded mx-1">{t.explanation.code}</code>
                </p>
                <p>
                    {t.explanation.p2}
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    {t.explanation.list.map((item, idx) => (
                        <li key={idx}><span className="text-slate-200">{item}</span></li>
                    ))}
                </ul>
            </div>
        </section>

      </div>
    </div>
  );
};

export default App;
