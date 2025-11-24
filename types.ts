export enum Precision {
  HALF = 'HALF',
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE'
}

export interface FloatComponents {
  sign: string;
  exponent: string;
  mantissa: string;
  fullBinary: string;
  hex: string;
  value: number;
}

export interface PrecisionConfig {
  bits: number;
  exponentBits: number;
  mantissaBits: number;
  bias: number;
}
