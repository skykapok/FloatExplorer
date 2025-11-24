export type Language = 'en' | 'zh';

export const translations = {
  en: {
    title: "Float Explorer",
    subtitle: "Interactive IEEE 754 Visualization",
    precisions: {
      HALF: "16-bit (Half)",
      SINGLE: "32-bit (Single)",
      DOUBLE: "64-bit (Double)"
    },
    inputLabel: "Decimal Literal Input",
    inputPlaceholder: "e.g. 0.1, NaN, Infinity",
    reset: "Reset to 0",
    prevFloat: "Prev Float",
    nextFloat: "Next Float",
    actualValue: "Actual Stored Value (Memory)",
    precisionWarning: "The typed input cannot be exactly represented in binary.",
    rawReference: "Raw JS (64-bit) Reference:",
    legend: {
      sign: "Sign",
      exponent: "Exponent",
      mantissa: "Mantissa / Fraction"
    },
    reconstruction: {
      title: "Reconstruction Formula",
      value: "Value",
      exponentCalc: "Exponent Calculation",
      bias: "Bias",
      subnormal: "Subnormal Number (Exponent is 0)",
      mantissaVal: "Mantissa Value (Decimal)"
    },
    explanation: {
      title: "Why does 0.1 become 0.10000000149...?",
      p1: "In base 10 (decimal), 0.1 is a simple fraction (1/10). However, computers store numbers in base 2 (binary). Just like 1/3 (0.3333...) repeats infinitely in decimal, 1/10 repeats infinitely in binary:",
      code: "0.00011001100110011...",
      p2: "Because memory is finite (32 or 64 bits), we must chop off (truncate) this infinite repeating sequence at some point. This creates a tiny rounding error. When you convert that truncated binary back to decimal, you get the \"Actual Stored Value\" seen above.",
      list: [
        "Sign bit: Determines positive (0) or negative (1).",
        "Exponent: Scales the number (powers of 2). It's stored with a \"bias\" so we don't need a second sign bit for the exponent.",
        "Mantissa (Fraction): The precision bits. For normal numbers, there's an invisible \"1.\" assumed before these bits."
      ]
    },
    bitTooltips: {
      sign: "Sign Bit",
      exponent: "Exponent Bit",
      mantissa: "Mantissa Bit"
    }
  },
  zh: {
    title: "浮点数探秘",
    subtitle: "IEEE 754 交互式可视化工具",
    precisions: {
      HALF: "16位 (半精度)",
      SINGLE: "32位 (单精度)",
      DOUBLE: "64位 (双精度)"
    },
    inputLabel: "十进制字面量输入",
    inputPlaceholder: "例如 0.1, NaN, Infinity",
    reset: "重置为 0",
    prevFloat: "上一浮点数",
    nextFloat: "下一浮点数",
    actualValue: "实际存储值 (内存值)",
    precisionWarning: "输入的数值无法在二进制中精确表示 (存在精度丢失)。",
    rawReference: "原始 JS (64位) 参考值:",
    legend: {
      sign: "符号位",
      exponent: "指数位",
      mantissa: "尾数位 / 小数位"
    },
    reconstruction: {
      title: "还原公式",
      value: "数值",
      exponentCalc: "指数计算",
      bias: "偏移量",
      subnormal: "非规格化数 (指数为 0)",
      mantissaVal: "尾数部分 (十进制)"
    },
    explanation: {
      title: "为什么 0.1 变成了 0.10000000149...?",
      p1: "在十进制中，0.1 是一个简单的分数 (1/10)。但在计算机使用的二进制中，就像 1/3 在十进制中是无限循环小数 (0.333...) 一样，1/10 在二进制中也是无限循环的：",
      code: "0.00011001100110011...",
      p2: "由于内存空间有限 (如 32位 或 64位)，计算机必须截断这个无限序列。这就产生了微小的舍入误差。当你把截断后的二进制转换回十进制时，就得到了上面的“实际存储值”。",
      list: [
        "符号位 (Sign): 决定正数 (0) 或 负数 (1)。",
        "指数位 (Exponent): 数值的缩放因子 (2的幂)。它存储时加了一个“偏移量 (Bias)”，这样就不需要额外的符号位来表示负指数。",
        "尾数位 (Mantissa): 有效数字部分。对于规格化数，默认隐含了一个“1.”。"
      ]
    },
    bitTooltips: {
      sign: "符号位",
      exponent: "指数位",
      mantissa: "尾数位"
    }
  }
};
