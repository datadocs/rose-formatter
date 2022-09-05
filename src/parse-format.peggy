{
  let trailingCommas = 0;
  let percentSymbols = 0;
  function $(s, type){
    if(typeof s !== 'object'){
      s = {mask: s}
    }
    if(type)s.type = type;
    s.source = {start:peg$savedPos, end: peg$currPos, text: text()};
    return s;
  }
  function resolveMonthOrMinutes(parts){
    // To disambiguate m, as minutes or as month
    let unresolved = null;
    let timeSeen = false;
    for(let i = 0; i < parts.length; ++i){
      switch(parts[i].type){
        case 'time':
          if(['am/pm', 'a/p'].includes(parts[i].mask)){
            continue;
          }
          timeSeen = true;
          if(unresolved && ['s', '.'].includes(parts[i].mask[0])){
            // m followed by s or fraction of second
            unresolved.type = 'time'
            unresolved = null;
          }
          break;
        case 'date':
          timeSeen = false;
          break;
        case 'datetime':
          if(unresolved){
            unresolved.type = 'date';
          }
          if(timeSeen){
            parts[i].type = 'time';
            timeSeen = false;
            unresolved = null;
          }else{
            unresolved = parts[i];
          }
          break
      }
    }
    if(unresolved){
      unresolved.type = 'date';
    }
    return parts;
  }
  function setFlags(format){
    format.isDate = false;
    format.percent = 0;
    format.clockHours = 24;
    for(const part of format.parts || []){
      if(part.type === 'date' || part.type === 'format'){
        format.isDate = true;
      }
      if(part.mask === 'am/pm' || part.mask === 'a/p'){
        format.clockHours = 12;
      }
    }
    return format;
  }

  function countPercentSymbols(f, parts){
    let numPercentSymbols = 0
    for(const part of parts){
      if(part.type === 'separator' && part.mask === '%'){
        ++numPercentSymbols
      }
    }
    f.numPercentSymbols = numPercentSymbols;
    return f;
  }
  function countTrailingCommas(f, parts){
    let trailingCommas = 0;
    let followsNumber = false;
    
    for(const part of parts){
      if(part.type === 'separator' && part.mask === ','){
        if(followsNumber){
          part.mask = ''
          f.thousandSeparator = options.thousandSeparator || ',';
          ++trailingCommas;
        }else{
          part.type = 'literal'
        }
      }else if(part.type === 'digit'){
        trailingCommas = 0;
        followsNumber = true;
      }else{
        followsNumber = false;
      }
    }
    f.numTrailingCommas = trailingCommas;
    return f;
  }

  function computeRange(parts){
    let firstReserved = null;
    let lastReserved = null;
    let totalPositions = 0
    for(let i = 0; i < parts.length; ++i){
      const part = parts[i]
      if(part && part.type && part.type === 'digit'){
        if(part.mask === '0'){
          if(firstReserved === null){
            firstReserved = totalPositions;
          }
          lastReserved = totalPositions;
        }
        ++totalPositions;
      }
    }
    return {parts, firstReserved, lastReserved, totalPositions}
  }
  function nonEmpty(format){
    if(format.firstReserved === null){
      format.firstReserved = format.totalPositions - 1;
    }
    return format;
  }
}

Main = MultiFormat
MultiFormat = r:ConditionalFormat h:(';' c: ConditionalFormat {return c})* {
  return [r, ...h];
}

ConditionalFormat = condition:Condition? format:Format {
  setFlags(format);
  return {condition, format}
}
Format = ScientificFormat / FractionFormat / FixedFormat / IntegerFormat / DateTimeFormat

ScientificFormat = mantissa: (FixedFormat / IntegerFormat) exponent: Exponent {
  return {mantissa, exponent, type:'scientific'}
}

FractionFormat = int:IntegerPartFormat? fraction:Fraction {
  return {int, fraction, type: 'fraction'}
}

FixedFormat = int:OptionalIntegerPartFormat separator:DecimalSeparator decimal:DecimalPartFormat {
  const parts = [...int.parts, ...decimal.parts] 
  const ans = {int, decimal, type: 'fixed'}
  countTrailingCommas(ans, parts)
  countPercentSymbols(ans, parts)
  return ans;
}

OptionalIntegerPartFormat = i:IntegerPartFormat? {
  return i || computeRange([])
}

IntegerFormat = int:IntegerPartFormat {
  const ans = {int, type: 'integer'};
  countTrailingCommas(ans, int.parts)
  countPercentSymbols(ans, int.parts)
  return ans;
}

IntegerPartFormat = parts:(!(Fraction / Exponent / DecimalSeparator) @IntegerFormatToken)+
{
  return computeRange(parts)
}
NonEmptyIntegerPartFormat = parts:IntegerPartFormat
&{
  // Reject formats without a digit mask
  return parts.totalPositions >= 1
} {
  return nonEmpty(parts)
}

IntegerFormatToken = (TextContent / DigitMask / NumericSeparator / DigitGroup / Percent / Unrecognized)
DecimalPartFormat = parts:DecimalFormatToken+
{
  return computeRange(parts)
}
DecimalFormatToken 'decimal format token' = TextContent / DigitMask / LiteralDot / NumericSeparator / Unrecognized
NumeratorFormat = HiddenComma? prefix:(TextContent / Percent / LiteralComma / Space)* digits:DigitMask+ {
  return nonEmpty(computeRange([...prefix, ...digits]))
}


Condition='[' compare:Comparator value:NumericConstant ']'{
  return $({compare, value})
}
HiddenComma = ',' {return $({type:'literal', mask: ''})}
LiteralDot = '.' {return $({type: 'literal', mask: '.'})}
LiteralComma = ',' {return $({type:'literal', mask: ','})}


Comparator =  '<>' / '<=' / '<' / '>=' / '>' / '='
NumericConstant = s:$([+-]? [0-9]+ ('.' [0-9]*)? ('e'i [+-]? [0-9]+)?) {return Number(s)}
IntegerConstant "integer-number" = n:$([1-9][0-9]+) {return parseInt(n)};
Hidden "hidden" = '_' mask:(Escaped / .) {return $({type: 'hidden',  mask})}
TextContent = Hidden / Fill / Literal
Literal "literal" = mask:(Quoted / Escaped / Spaces){
  return $(mask, 'literal')
}
Quoted "quoted-string" = '"'  literal:$[^"]* '"' {return literal}
Escaped "escaped-char" = '\\' literal:. {return literal}
Spaces = $(Space+ !'*')
Space "space" = [ \t];
Fill = mask:(Quoted / Escaped / Space) '*' {
  return $(mask, 'fill')
}

NumericSeparator "separator" = d:(DigitGroup / DecimalSeparator / Percent) {
  return $({type: 'separator', mask: d})
}

Exponent = e:'E' sign:$[+-] + mask: IntegerPartFormat {
  nonEmpty(mask)
  return $({sign, mask}, 'exponent')
}

Fraction = DeterminedDenominatorFraction / UndeterminedFraction
FormattedInteger = IntegerPart+
IntegerPart = (TextContent / DigitMask / Unrecognized)
FracPart = !'/'  s:IntegerPart {return s}

UndeterminedFraction = numerator:NumeratorFormat '/' denominator:FracPart+ {
  return $({numerator, denominator: nonEmpty(computeRange(denominator))}, 'fraction')
}
DeterminedDenominatorFraction = numerator:NumeratorFormat '/' denominator:IntegerConstant {
  return $({numerator, denominator}, 'fixed-fraction')
}

// If the character is not consumed by any of the known rules
// it is handled as a literal symbol
Unrecognized "unmapped-char" = !(TimeToken/DateToken) mask:[^E;0#?\[\]/]i {return $({type: 'literal', mask})}

DigitMask "digit-mask" = mask:('#' / '0' / '?'){
  return $({type: 'digit', mask})
}
DigitGroup = ','
// The first occurrency will be the decimal separator the subsequent 
// occurrencies are literal.
DecimalSeparator = '.'
Percent = '%'

DateTimeFormat = f:(
    !';' @(TextContent / DateTimeToken / EllapsedTime / DateTimeSeparator)+
  ) {return {type: 'datetime', parts: resolveMonthOrMinutes(f)}}

DateTimeToken = d:(DateToken / TimeToken / MonthOrMinutes)

DateFormat = DateToken
// Decimal separators in this context always refer to fractions of seconds.
DateToken = mask:(Day / Year / MonthName) {
  return $(mask.toLowerCase(), 'date')
} / MonthOrMinutes
Day = WeekDay / MonthDay
WeekDay = ('dddd'i 'd'i* / 'aaaa'i 'a'* &{return options.undocumentedFeatures}) {return 'dddd'} / 
  ('ddd'i / 'aaa' &{return options.undocumentedFeatures}) {return 'ddd'}
MonthDay = 'dd'i / 'd'i
Year = 'yyy'i 'y'i* {return 'yyyy'} / 'y'i+ {return 'yy'}

// Excel 2016 uses /mmmmm+/ to denote month initial
// Irrelevant for English, since it leads to ambiguous strings.
// i.e. J, F, M, A, M, J, J, A, S, O, N, D
MonthName = x:$('mm' 'm'i+) {return x.substr(0,5)}

MonthOrMinutes = mask: ('mm'i / 'm'i) {return $(mask.toLowerCase(), 'datetime')}

TimeToken = mask:(Hours /Seconds / AMPM) {
  return $(mask.toLowerCase(), 'time')
} / MonthOrMinutes / FractionOfSecond / EllapsedTime
Hours =  x:$('h'i+) {return x.substr(0,2)}
AMPM = 'AM/PM'i / 'A/P'i
Seconds = x:$('s'i+) {return x.substr(0,2)}
FractionOfSecond = x:$('.' '0'+) {return $({mask:'.0', zfill: x.length-1}, 'time')}
DateTimeSeparator= Commas / Slash / Unrecognized

// Strange behavior on excel. On dates, multiple consecutive commas
// appear as a single comma, probably a side effect of the logic for
// different cases. let's try to reproduce.
Commas = ','+ {return $({type:'literal',mask:','})}
Slash = '/' {return $({type: 'literal', mask:'/'})}
// These formats will show counted hours minutes and seconds the number of figures in the
// format is the minimum length eg. 5 hours and 20 seconds in the format [m] gives 300
// in the format [m]:ss gives 300:20, in the format [mmmmm] gives 00300.
EllapsedTime = '[' x:$('h'i+/'m'i+/'s'i+) ']' {
  return $({type:'time', mask: '[' + x[0].toLowerCase() + ']', zfill: x.length})
}

