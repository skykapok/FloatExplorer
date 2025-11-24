import { Precision, FloatComponents, PrecisionConfig } from '../types';

export const CONFIGS: Record<Precision, PrecisionConfig> = {
  [Precision.HALF]: { bits: 16, exponentBits: 5, mantissaBits: 10, bias: 15 },
  [Precision.SINGLE]: { bits: 32, exponentBits: 8, mantissaBits: 23, bias: 127 },
  [Precision.DOUBLE]: { bits: 64, exponentBits: 11, mantissaBits: 52, bias: 1023 },
};

// Helper for 16-bit Float (Half Precision)
// JS doesn't have native Float16Array fully supported yet, so we emulate.
const float16ToNumber = (int16: number): number => {
  const sign = (int16 & 0x8000) >> 15;
  let exponent = (int16 & 0x7c00) >> 10;
  let mantissa = int16 & 0x03ff;

  if (exponent === 0) {
    if (mantissa === 0) return sign ? -0 : 0;
    // Subnormal
    return (sign ? -1 : 1) * Math.pow(2, -14) * (mantissa / 1024);
  } else if (exponent === 31) {
    return mantissa ? NaN : (sign ? -Infinity : Infinity);
  }

  return (sign ? -1 : 1) * Math.pow(2, exponent - 15) * (1 + mantissa / 1024);
};

const numberToFloat16 = (val: number): number => {
  // Use a Float32 to handle the heavy lifting of rounding, then pack to 16
  const floatView = new Float32Array(1);
  const int32View = new Uint32Array(floatView.buffer);

  floatView[0] = val;
  const x = int32View[0];

  const bits = (x >> 16) & 0x8000; /* Get the sign */
  let m = (x >> 12) & 0x07ff; /* Keep one extra bit for rounding */
  const e = (x >> 23) & 0xff; /* Using only the exponent */

  /* If zero, or denormal, or exponent underflows too much for a denormal half, return signed zero. */
  if (e < 103) {
    return bits;
  }

  /* If NaN, return NaN. If Inf or exponent overflow, return Inf. */
  if (e > 142) {
    /* If NaN, make sure to generate non-zero mantissa (qNaN = 0x7e00) */
    if (e === 255 && (x & 0x007fffff) !== 0) return 0x7e00; 
    /* Otherwise return +/- infinity */
    return bits | 0x7c00;
  }

  /* If exponent underflows but not too much, return a denormal */
  if (e < 113) {
    m |= 0x0800;
    /* Extra rounding may overflow and set mantissa to 0 and exponent to 1, which is OK. */
    return bits | ((m >> (114 - e)) + ((m >> (113 - e)) & 1));
  }

  return bits | ((e - 112) << 10) | (m >> 1) + (m & 1);
};


export const getFloatComponents = (value: number, precision: Precision): FloatComponents => {
  let buffer: ArrayBuffer;
  let view: DataView;
  let binaryString = '';

  if (precision === Precision.HALF) {
    const int16 = numberToFloat16(value);
    binaryString = int16.toString(2).padStart(16, '0');
    
    // Recalculate value from the packed bits to show actual stored precision
    value = float16ToNumber(int16);
    
  } else if (precision === Precision.SINGLE) {
    buffer = new ArrayBuffer(4);
    view = new DataView(buffer);
    view.setFloat32(0, value);
    const int32 = view.getUint32(0);
    binaryString = int32.toString(2).padStart(32, '0');
    value = view.getFloat32(0); // Ensure we return the actual 32-bit value
  } else {
    buffer = new ArrayBuffer(8);
    view = new DataView(buffer);
    view.setFloat64(0, value);
    const bigInt64 = view.getBigUint64(0);
    binaryString = bigInt64.toString(2).padStart(64, '0');
    // Value remains standard JS double
  }

  const config = CONFIGS[precision];
  const sign = binaryString.substring(0, 1);
  const exponent = binaryString.substring(1, 1 + config.exponentBits);
  const mantissa = binaryString.substring(1 + config.exponentBits);

  // Hex generation
  const hexGroups = [];
  for (let i = 0; i < binaryString.length; i += 4) {
    hexGroups.push(parseInt(binaryString.substring(i, i + 4), 2).toString(16).toUpperCase());
  }

  return {
    sign,
    exponent,
    mantissa,
    fullBinary: binaryString,
    hex: hexGroups.join(''),
    value // The potentially truncated/expanded value
  };
};

export const updateBit = (
  currentValue: number, 
  precision: Precision, 
  bitIndex: number // 0 is MSB (Sign)
): number => {
  const components = getFloatComponents(currentValue, precision);
  const chars = components.fullBinary.split('');
  
  // Toggle the bit
  chars[bitIndex] = chars[bitIndex] === '0' ? '1' : '0';
  const newBinary = chars.join('');

  if (precision === Precision.HALF) {
    const int16 = parseInt(newBinary, 2);
    return float16ToNumber(int16);
  } else if (precision === Precision.SINGLE) {
    const int32 = parseInt(newBinary, 2);
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, int32);
    return view.getFloat32(0);
  } else {
    const bigInt = BigInt('0b' + newBinary);
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigUint64(0, bigInt);
    return view.getFloat64(0);
  }
};

export const getNeighborFloat = (currentValue: number, precision: Precision, direction: 'next' | 'prev'): number => {
  // Logic: treat bit pattern as integer, add/sub 1.
  if (Number.isNaN(currentValue)) return currentValue;
  if (!Number.isFinite(currentValue)) {
     // Handle Infinity boundaries
     if (currentValue === Infinity && direction === 'prev') {
        // Return Max Finite
        if (precision === Precision.HALF) return 65504;
        if (precision === Precision.SINGLE) return 3.402823466e+38; 
        return Number.MAX_VALUE;
     }
     if (currentValue === -Infinity && direction === 'next') {
        // Return Min Finite (Most negative finite)
        if (precision === Precision.HALF) return -65504;
        if (precision === Precision.SINGLE) return -3.402823466e+38;
        return -Number.MAX_VALUE;
     }
     return currentValue;
  }

  if (precision === Precision.HALF) {
     let int16 = numberToFloat16(currentValue);
     // Handle -0 to +0 transition and sign crossing
     // Float ordering as Integers: 
     // Positive floats map linearly to positive integers.
     // Negative floats map inversely (in standard sign-magnitude).
     // However, simpler way: DataView manipulation + logic.
     
     // Easier approach: Convert to signed magnitude integer logic
     // 0x0000 (0) -> 0x0001 (Smallest subnormal)
     // 0x8000 (-0) -> 0x8001 (Smallest neg subnormal)
     // This is actually tricky because of the sign bit. 
     // Standard IEEE 754 float increment logic:
     // If positive, increment int representation.
     // If negative, decrement int representation (moves towards 0).
     // If -0, switch to +0 then increment? No, -0 is 0x8000. 
     
     // Let's use the property that IEEE floats sort like signed magnitude integers if you toggle the sign bit logic? No.
     
     // Correct Step Logic:
     // 1. Get bits.
     // 2. If value > 0: increment bits for next, decrement for prev.
     // 3. If value < 0: decrement bits for next (towards 0/pos), increment for prev (towards -inf).
     // 4. If value === 0:
     //    If next: return smallest positive.
     //    If prev: return smallest negative.
     //    Note: +0 is 0x0000. -0 is 0x8000.
     
     if (currentValue === 0) {
        // If it's technically -0
        const isNegZero = Object.is(currentValue, -0);
        if (direction === 'next') {
           return isNegZero ? 0 : float16ToNumber(1); 
        } else {
           return isNegZero ? float16ToNumber(0x8001) : -0;
        }
     }

     if (currentValue > 0) {
        if (direction === 'next') int16++;
        else int16--;
     } else {
        if (direction === 'next') int16--; // Magnitude decreases (e.g. -2 -> -1)
        else int16++; // Magnitude increases (e.g. -1 -> -2)
     }
     return float16ToNumber(int16);
  } 
  
  if (precision === Precision.SINGLE) {
     const buf = new ArrayBuffer(4);
     const view = new DataView(buf);
     view.setFloat32(0, currentValue);
     let int32 = view.getUint32(0);

     if (currentValue === 0) {
        const isNegZero = Object.is(currentValue, -0);
        if (direction === 'next') return isNegZero ? 0 : 1.401298464324817e-45;
        else {
           // Smallest negative
           view.setUint32(0, 0x80000001);
           return view.getFloat32(0);
        }
     }

     if (currentValue > 0) {
        if (direction === 'next') int32++;
        else int32--;
     } else {
        if (direction === 'next') int32--;
        else int32++;
     }
     
     view.setUint32(0, int32);
     return view.getFloat32(0);
  }

  // DOUBLE
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setFloat64(0, currentValue);
  let bigInt = view.getBigUint64(0);

  if (currentValue === 0) {
      const isNegZero = Object.is(currentValue, -0);
      if (direction === 'next') return isNegZero ? 0 : 5e-324;
      else {
          view.setBigUint64(0, 9223372036854775809n); // 0x8000...01
          return view.getFloat64(0);
      }
  }

  if (currentValue > 0) {
     if (direction === 'next') bigInt++;
     else bigInt--;
  } else {
     if (direction === 'next') bigInt--;
     else bigInt++;
  }
  
  view.setBigUint64(0, bigInt);
  return view.getFloat64(0);
}

// Format a number avoiding scientific notation to show true precision
export const formatDecimal = (num: number): string => {
  if (Number.isNaN(num)) return "NaN";
  if (!Number.isFinite(num)) return num > 0 ? "Infinity" : "-Infinity";
  if (Object.is(num, -0)) return "-0.0";
  
  // Try to use toLocaleString with high fraction digits for standard display, 
  // but it might round.
  // toFixed is safer for "No Scientific Notation".
  
  const str = num.toFixed(100); 
  // Trim trailing zeros, but keep one if it's an integer like "1.0"
  // Also trim the decimal point if it ends there.
  return str.replace(/\.?0+$/, "");
};
