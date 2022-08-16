
  export type Condition = {
    compare: '<' | '>' | '<>' | '>=' | '<=' | '=',
    value: number
  }

  export type MultiFormat = ConditionalFormat[];

  export type ConditionalFormat = {
    condition: Condition | null,
    format: GenericFormat
  };

  export type GenericFormat = 
      ScientificFormat 
    | FixedFormat 
    | IntegerFormat 
    | FractionFormat 
    | DateTimeFormat;

  export type FixedFormat = {
    type: 'fixed',
    numTrailingCommas: number,
    numPercentSymbols: number,
    thousandSeparator?: string,
    int: MaskedNumber,
    decimal: MaskedNumber
  };

  export type IntegerFormat = {
    type: 'integer',
    numTrailingCommas: number,
    numPercentSymbols: number,
    thousandSeparator: string,
    int: MaskedNumber
  };

  export type ScientificFormat = {
    type: 'scientific',
    mantissa: FixedFormat | IntegerFormat,
    exponent: Exponent,
  };

  export type Exponent = {
    type: 'exponent',
    sign: '+' | '-',
    mask: MaskedNumber
  };

  export type Digit = {
    type: 'digit', mask: DigitMask
  };
  export type Separator = {
    type: 'separator', mask: string
  };
  export type Literal = {
    type: 'literal', mask: string
  };
  export type Hidden = {
    type: 'hidden', mask: string
  };
  export type Fill = {
    type: 'fill', mask: string
  };
  export type DigitMask = '#' | '0' | '?';
  export type TextContent = Literal | Hidden | Fill;
  export type MaskedNumericToken = TextContent | Digit | Separator;

  export type DateTimeFormat = {
    type: 'datetime',
    clockHours: 12 | 24,
    parts: (TextContent | DateToken | TimeToken)[];
  }

  export type DateToken = {
    type: 'date',
    mask: 'yyyy' | 'eeee' | 'yy' | 'ee' | 
       'd' | 'dd' | 'ddd' | 'dddd' | 
       'm' | 'mm' | 'mmm' | 'mmmm' | 'mmmmm'
  }

  export type DateTimeToken = {
    type: Date,
    mask: DayMask 
        | YearMask 
        | MonthNameMask 
        // 'm' and 'mm' may be resolved to month
        // or to minutes.
        | MonthOrMinutes
  };
  export type DayMask = 'd' | 'dd' | 'ddd' | 'dddd';
  export type YearMask = 'yyyy' | 'yy';
  export type MonthNameMask = 'mmm' | 'mmmm' | 'mmmmm';
  export type MonthOrMinutes = 'm' | 'mm';
  export type TimeToken = {
    type: 'time',
    zfill?: number,
    mask: HoursMask
        | SecondsMask
        | AMPMMask
        // 'm' and 'mm' may be resolved to month
        // or to minutes.
        | MonthOrMinutes
        | FractionOfSecondMask
        | EllapsedTimeMask
  };

  export type AMPMMask = 'am/pm' | 'a/p';
  export type HoursMask = 'h' | 'hh';
  export type SecondsMask = 's' | 'ss';
  export type FractionOfSecondMask = '.0' 
  export type EllapsedTimeMask = '[h]' | '[m]' | '[s]'
  export type MaskedNumber = {
    type: 'masked-number',
    parts: MaskedNumericToken[],
    firstReserved: number,
    lastReserved: number,
    totalPositions: number
  }

  export type FractionFormat = {
    type: 'fraction',
    int: MaskedNumber,
    fraction: {
      numerator: MaskedNumber,
      denominator: number | MaskedNumber
    }
  };

  declare function parse(s: string): MultiFormat;

