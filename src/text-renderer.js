
const formatParser = require('./parse-format')
/**
 * @typedef {{
 *  mask: string,
 *  type: 'hidden' | 'literal'
 * }} PlainToken
 * 
 * @typedef {{
 *  mask: 'string'
 *  type: 'time' | 'date'
 * }} DateToken
 * 
 * @typedef {{
 *   mask: '0' | '?' | '#'
 *   type: 'digit',
 *   firstDigit?: number,
 *   lastDigit?: number
 * }} DigitToken
 * 
 * @typedef {{
 *   mask: '%' | ',' | '.'
 *   type: 'separator'
 * }} SeparatorToken
 * 
 * @typedef {DateToken | PlainToken} MaskedDateToken
 * @typedef {DigitToken | PlainToken} MaskedDigitToken
 * 
 * @typedef {{
 *   type: 'exponent',
 *   sign: '+' | '-'
 *   mask : MaskedDigitToken[]
 * }} ExponentPart
 * 
 * Currently used only for fractions, the denominator may be
 * specified as an integer that will be parsed as a string
 * @typedef {string} ConstantInteger
 * 
 * @typedef {{
 *   type: 'fraction,
 *   numerator : MaskedDigitToken[],
 *   denominator: MaskedDigitToken[]
 * } | {
 *   type: 'fixed-fraction',
 *   numerator : MaskedDigitToken[],
 *   denominator: ConstantInteger
 * }} FractionPart
 * 
 * @typedef {
 *   (MaskedDigitToken | SeparatorToken | FractionPart | ExponentPart)[]
 * } NumberFormatParts 
 * 
 * @typedef {
 *   MaskedDateToken[]
 * } DateFormatParts
 * 
 * @typedef {{
 *  compare: '>' | '<' | '>=' | '<=' | '=' | '<>',
 *  value: number
 * }} FormatCondition
 * 
 * @typedef {{
 *   type: 'number',
 *   condition: FormatCondition
 *   parts: NumberFormatParts
 * } | {
 *   type: 'datetime',
 *   condition: FormatCondition,
 *   parts: DateFormatParts
 * }} Format
 * 
 * @typedef {{
 *   requiredDigits: number,
 *   specifiedDigits: number
 * }} IntMaskLimits
 * 
 * @typedef {{
 *  intPart: number
 *  numerator: number,
 *  denominator: number 
 * }} RationalApproximation
 */
let THOUSAND_SEPARATOR = ',';
let MATCH_EXCEL_FRACTIONS = true;
const weekDays = [
  'Sunday', 'Monday', 'Tueseday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
]

function ampm(date){
  return (((date.getHours() + 23) % 24) < 12) ? 'am': 'pm'
}
/**
 * Determines whether the condition is satisfied by the 
 * given value.
 * @param {FormatCondition} cond 
 * @param {number} n 
 * @returns {boolean}
 */
function testCondition(cond, n){
  if(cond === null){
    return true
  }
  switch(cond.compare){
    case '<>':return n != cond.value;
    case '=':return n === cond.value;
    case '<': return n < cond.value;
    case '<=': return n <= cond.value;
    case '>=': return n >= cond.value;
    case '>': return n > cond.value;
  }
}

class BasicRenderer {

  constructor(s){
    this.format = formatParser.parse(s);
    for(const format of this.format){
      switch(format.type){
        case 'numeric':
          this.allocateDigits(format);
          break
      }
    }
  }
  
  /**
   * Utility function to avoid replicating code where a part
   * of the format is defined by an integer number, possibly
   * masked in different ways.
   * 
   * By the time it is written it will be used for fraction
   * numerators and denominators, and for exponents.
   * @param {MaskedDigitToken[]} parts 
   * @returns {IntMaskLimits}
   */
  allocateDigitsAux(parts){
    let requiredDigits = 0;
    const digits = parts.filter(
      p => p.type == 'digit' && /^[#?0]$/.exec(p.mask)
    );
    if(digits.length !== 0){
      digits.forEach((part, i) => {
        part.lastDigit = part.firstDigit = digits.length - i - 1;
        if(part.mask === '0'){
          requiredDigits = Math.max(requiredDigits, part.lastDigit + 1)
        }
      })
      delete digits[0].firstDigit
    }
    return {
      requiredDigits, specifiedDigits: digits.length
    }
  }
  /**
   * Modify the format parts assigning positions for the digits
   * with different roles and compute some quantities that helps
   * to accelerate the text rendering
   * @param {Format} format 
   */
  allocateDigits(format){
    const parts = format.parts;
    const left = []
    let i;
    let displayFactor = 1;
    let thousandSeparator = '';
    let trailingCommas = 0;
    let followsNumber = false;
    
    for(const part of parts){
      if(part.type === 'separator' && part.mask === ','){
        if(followsNumber){
          part.mask = ''
          thousandSeparator = THOUSAND_SEPARATOR;
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

    displayFactor *= Math.pow(1000, -trailingCommas)

    for(const part of parts){
      if(part.type === 'separator' && part.mask === '%'){
        displayFactor *= 100;
      }
    }
    
    let displayedDecimalDigits = 0;
    let requiredDecimalDigits = 0;
    let requiredIntegerDigits = 1;
    let exponent = null;
    let fraction = null;

    loop: for(i = 0; i < parts.length; ++i){
      if(parts[i].type === 'digit'){
        switch(parts[i].mask){
          case '#':
          case '?':
          case '0':
            left.push(parts[i]);
            break;
        }
      }else if(parts[i].type === 'separator'){
        switch(parts[i].mask){
          case '%':
          case '.':
            break loop;
        }
      }else if(parts[i].type === 'exponent'){
        --i;
        break
      }else if(parts[i].type === 'fraction' || parts[i].type === 'fixed-fraction'){
        /**
         * @type {FractionPart}
         */
        const fr = parts[i]
        // The fraction affects the semantic of #, 0, or '?' that follows.
        // This could be more elegantly handled if we refactored the parser
        for(let j = i + 1; j < parts.length; ++j){
          if(parts.type == 'digit'){
            parts.mask = (parts.mask === '?') ? ' ' : '0';
            parts.type = 'literal'
          }
        }
        if(fr.type == 'fixed-fraction'){
          fr.meta = {numerator: this.allocateDigitsAux(fr.numerator)}
        }else{
          fr.meta = {
            numerator: this.allocateDigitsAux(fr.numerator),
            denominator: this.allocateDigitsAux(fr.denominator)
          };
        }
        fraction = fr;
        break
      }
    }
    if(left.length !== 0){
      left.forEach((part, i) => {
        part.lastDigit = part.firstDigit = left.length - i - 1;
        if(part.mask === '0'){
          requiredIntegerDigits = Math.max(requiredIntegerDigits, part.lastDigit + 1)
        }
      })
      delete left[0].firstDigit;
    }
    let pos = -1;
    while(++i < parts.length){
      if(parts[i].type === 'digit'){
        switch(parts[i].mask){
          case '#':
          case '?':
          case '0':
            if(parts[i].mask === '0'){
              requiredDecimalDigits = -pos;
            }
            displayedDecimalDigits = -pos;
            parts[i].firstDigit = parts[i].lastDigit = pos--;
            break;
        }
      }else if(parts[i].type === 'exponent'){
        exponent = {...this.allocateDigitsAux(parts[i].mask), alignment: left.length}
        break;
      }
    }
    format.meta = {
      requiredDecimalDigits, 
      requiredIntegerDigits, 
      specifiedIntegerDigits: left.length,
      displayedDecimalDigits,
      thousandSeparator,
      displayFactor,
      exponent,
      fraction
    }
  }
}

class TextRenderer extends BasicRenderer {
  constructor(s){
    super(s)
  }

  /**
   * @param {Date} date 
   * @returns {string}
   */
  formatDate(date){
    const cond = this.format[0];
    return cond.parts.map((t) => {
      switch(t.type) {
        case 'time':
          switch(t.mask){
            case 'm':
            case 'mm':
              return date.getMinutes().toString().padStart(t.mask.length, '0')
            case 'h':
            case 'hh':
              return ((cond.clockHours === 12) 
                ? (((date.getHours() + 11) % 12) + 1) 
                : date.getHours()
              ).toString().padStart(t.mask.length, '0')
            case 's':
            case 'ss':
              return date.getSeconds().toString().padStart(t.mask.length, '0')
            case '.0':
              return (date.getMilliseconds() / 1000).toFixed(t.zfill).substr(1)
            case '[s]':
              return Math.floor(date.getTime()/1e3).toString().padStart(t.zfill, '0')
            case '[m]':
              return Math.floor(date.getTime()/6e4).toString().padStart(t.zfill, '0')
            case '[h]':
              return Math.floor(date.getTime()/3.6e6).toString().padStart(t.zfill, '0')
            case 'am/pm':
              return ampm(date)
            case 'a/p':
              return ampm(date)[0];
            /* istanbul ignore next */
            default:
              throw TypeError('Invalid time mask: ' + t.mask)
          }
        case 'date':
          switch(t.mask){
            case 'yyyy':
            case 'eeee':
              return date.getFullYear().toString();
            case 'yy':
            case 'ee':
              return (date.getFullYear() % 100).toString()
            case 'm':
            case 'mm':
              return (date.getMonth() + 1).toString().padStart(t.mask.length, '0');
            case 'd':
            case 'dd':
              return date.getDate().toString().padStart(t.mask.length, '0')
            case 'ddd':
              return weekDays[date.getDay()].substr(0,3);
            case 'dddd':
              return weekDays[date.getDay()]
            case 'mmm':
              return monthNames[date.getMonth()].substr(0, 3)
            case 'mmmm':
              return monthNames[date.getMonth()]
            case 'mmmmm':
              return monthNames[date.getMonth()][0]
            /* istanbul ignore next */
            default:
              throw TypeError('Invalid date mask: ' + t.mask)
          }
        case 'hidden':
          return ' ';
        case 'literal':
          return t.mask;
        /* istanbul ignore next */
        default:
          throw TypeError('Invalid token type for date: ' + t.type)
      }
    }).join('');
  }

  /**
   * Given a string representing a floating point number possibly
   * with some decimal digits, retrieve segments of it indexed
   * by the degree of the term associated to it in a polynomial
   * representation for the basis. For instance, digit 0, multiplies
   * by 1, the digit 3 multiplies by 1000, the digit -1 multiplies
   * by 0.1, and so on.
   * 
   * @param {string} s string representation 
   * @param {point} p position of the decimal seaprator
   * @param {*} firstDigit 
   * @param {*} lastDigit 
   * @returns 
   */
  segment(s, p, firstDigit, lastDigit){
    const _i1 = firstDigit >= 0 ? p - firstDigit - 1: p - firstDigit;
    const _i2 = lastDigit >= 0 ? p - lastDigit - 1: p - lastDigit;
    return s.substring(_i1, _i2 + 1);
  }

  /**
   * Given an integer format and a number produces the 
   * masked output.
   * @param {MaskedDigitToken[]} parts 
   * @param {number} n 
   * @param {IntMaskLimits} meta
   * @returns {string}
   */
  formatMaskedInteger(parts, n, meta){
    if(n < 0){
      return '-' + this.formatMaskedInteger(parts, -n, meta)
    }
    let s = n.toFixed(0)
    // Keep only what comes before the decimal separator
    s = s.replace(/\..*/, '')
    s = s.padStart(meta.requiredDigits, '0')
    const p = s.length
    return parts.map(part => {
      switch(part.type){
        case 'literal':
          return part.mask;
        case 'digit':
          return this.segment(s, p,
            Number.isInteger(part.firstDigit) ? part.firstDigit : p,
            part.lastDigit)
      }
    }).join('')
  }

  toFraction(n, denominatorLimit){
    if(n < 0){
      const r = this.toFraction(-n, denominatorLimit)
      r.numerator *= -1;
      r.intPart *= -1;
      return r;
    }
    return this.continuedFractionSearch(n, denominatorLimit)
  }
  /**
   * Find the best approximation for the number with the
   * given denominator limit.
   * @param {number} n 
   * @param {number} denominatorLimit 
   * @returns {RationalApproximation}
   */
  sternBrocotTreeSearch(n, denominatorLimit){
    const intPart = Math.floor(n)
    const fracPart = n - intPart;
    
    // Use Farey sequence to find the best fraction
    // approximation within the denominator limit
    let ln=0, ld=1, rn=1, rd=1;
    let numerator = 0, denominator = 1, err = fracPart;
    for(;;){
      let cn = ln + rn;
      let cd = ld + rd;
      if(cd > denominatorLimit){
        // The denominator exceeded the specified limit
        break;
      }
      let residual = cn / cd - fracPart
      if(residual < 0){
        ln = cn;
        ld = cd;
        residual = -residual;
      }else{
        rn = cn;
        rd = cd;
      }
      if(residual < err){
        numerator = cn;
        denominator = cd;
        err = residual;
        if(residual == 0){
          break; // no reason to keep searching
        }
      }
    }
    if(numerator == denominator){
      return {intPart:intPart + 1, numerator: 0, denominator: 1}
    }
    return {intPart, numerator, denominator}
  }
  /**
   * Find a reasonably good rational approximation for the given number
   * more efficiently than Stern Brocot tree.
   * This is not optimal, but it matches the Excel behavior
   * @param {number} n 
   * @param {number} denominatorLimit 
   * @returns {RationalApproximation}
   */
  continuedFractionSearch(n, denominatorLimit){
    let p0 = 0, q0 = 1, p1 = 1, q1 = 0
    let af = n;
    const quotients = []

    // The path in the Stern-Broccot tree could be expressed as 
    // L+L+L+....+L+R+R...+R, and compressed as a series of steps
    //   Take Right a1 times, 
    //   then Left a2 times,
    //   Then Right a3 times,
    //   and so on.
    // This algorithm will, each iteration will start from
    // p0/q0 and take `a` steps, the maximum number of steps
    // possible before changing direction.
    
    for(let i = 0; i < 20; ++i){
      let a = Math.floor(af)
      // This is equivalent to giving a steps 
      // from p0/q0 to the direction of p1/q1
      const q2 = q0 + a * q1;
      const p2 = p0 + a * p1;
      if(q2 > denominatorLimit){
        break;
      }
      // Now q1 will be the starting node
      p0 = p1;
      q0 = q1;
      p1 = p2;
      q1 = q2;
      if(af == a){
        return {intPart: ~~n, numerator: p1 % q1, denominator: q1};
      }
      af = 1/(af - a)
    }
    // Maybe the performing all the steps before changin
    // direction would exceed result in a fraction that 
    // violates the denominatorLimimt, but still would
    // be possible to give some steps
    // 
    // Let k be the maximum integer such that 
    //    q0+k*q1 < denominatorLimit
    // then k could be computed as 
    //    k = floor((denominatorLimit - q0)/q1)
    // the value (p0+k*p1) / (q0+k*q1) gives a better
    // approximation to n than p1/q1, and maybe better
    // than p0/q0.
    // 
    // It seems that this step is what what excel
    // is not doing

    if(Math.abs(p1/q1 - n) < Math.abs(p0/q0 - n)){
      return {intPart: ~~n, numerator: p1 % q1, denominator: q1}
    }else{
      return {intPart: ~~n, numerator: p0 % q0, denominator: q0}
    }
  }

  /**
   * @param {number} n 
   * @returns {string}
   */
  formatNumber(n){
    for(const format of this.format){
      if(testCondition(format.condition, n)){
        let transformedNumber = n * format.meta.displayFactor
        let exponent = 0;
        if(format.meta.exponent){
          const a = format.meta.exponent.alignment
          exponent = a * Math.floor(Math.log10(Math.abs(transformedNumber)) / a)
          transformedNumber *= Math.pow(10, -exponent)
        }
        let s;
        if(format.meta.fraction){
          // Round the integer part in the presence of a fraction
          const fr = format.meta.fraction;
          if(fr.type === 'fixed-fraction'){
            if(Math.round(transformedNumber * fr.denominator) % fr.denominator === 0){
              s = Math.abs(Math.round(transformedNumber))
            }else{
              s = Math.abs(Math.floor(transformedNumber)).toFixed(0)
            }
          }else{
            s = this.toFraction(transformedNumber, Math.pow(10, fr.meta.denominator.specifiedDigits)-1).intPart.toFixed(0)
          }
        }else{
          s = Math.abs(transformedNumber).toFixed(format.meta.displayedDecimalDigits);
        }
        // Adjust decimal places
        let p = s.indexOf('.')
        if(p === -1){
          p = s.length;
        }else{
          s = s.replace(/0+$/, '')
        }
        if(format.meta.requiredDecimalDigits > 0){
          s = s.padEnd(p+1, '.').padEnd(p + 1 + format.meta.requiredDecimalDigits, '0')
        }
        
        // Adjust integer digits
        if(p < format.meta.requiredIntegerDigits){
          s = s.padStart(s.length + format.meta.requiredIntegerDigits - p, '0')
          p = format.meta.requiredIntegerDigits;
        }
        
        // help to assign parts of the number
        const segment = (s, p, i1, i2) => {
          const _i1 = i1 >= 0 ? p - i1 - 1: p - i1;
          const _i2 = i2 >= 0 ? p - i2 - 1: p - i2;
          return commify(s.substring(_i1, _i2 + 1), i2);
        }
        // Positions to add separators, rule for western English
        const separatorAt = (i) => (i > 0) && (i % 3 === 0)
        // Procedure to add digit separators in the 
        const commify = (s, lastDigit) => {
          if(format.meta.thousandSeparator){
            return s.split('').map((c, i) => {
              if(separatorAt(s.length - i - 1 + lastDigit)){
                return c + format.meta.thousandSeparator;
              } else {
                return c;
              }
            }).join('')
          }else{
            return s;
          }
        }
        return (transformedNumber < 0?'-': '') + format.parts.map(part => {
          switch(part.type){
            case 'literal':
              return part.mask;
            case 'digit':
              return commify(this.segment(s, p,
                Number.isInteger(part.firstDigit) ? part.firstDigit : p,
                part.lastDigit), part.lastDigit);
            case 'exponent':
              // Very simplified exponent support, only E+0 or E-0
              return 'E' + (exponent >= 0 ? (part.sign === '+' ? '+': '') : '-') + 
                this.formatMaskedInteger(part.mask, Math.abs(exponent), format.meta.exponent)
            case 'fraction':
              {
                const approximation = this.toFraction(Math.abs(transformedNumber), 
                  Math.pow(10, part.meta.denominator.specifiedDigits)-1);
                if(format.meta.specifiedIntegerDigits == 0){
                  approximation.numerator += approximation.denominator * approximation.intPart;
                  approximation.intPart = 0;
                }
                return this.formatMaskedInteger(part.numerator, approximation.numerator, part.meta.numerator) + '/' + 
                  this.formatMaskedInteger(part.denominator, approximation.denominator, part.meta.denominator)
              }
            case 'fixed-fraction':
              {
                const denominator = part.denominator;
                let numerator = Math.round(Math.abs(transformedNumber) * denominator)
                if(format.meta.specifiedDigits == 0){
                  numerator %= denominator;
                }
                return this.formatMaskedInteger(part.numerator, part.numerator, part.meta.numerator) + '/' + 
                  part.denominator
              }
            default:
              // Expect not to reach here for a well constructed format
              return part.mask;
          }
        }).join('')
      }
    }
    return n.toString();
  }
}

module.exports = {TextRenderer, THOUSAND_SEPARATOR}