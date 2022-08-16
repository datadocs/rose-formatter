const {TextRenderer} = require('../src/text-renderer2')
const formatParser = require('../src/parse-format')
describe('Conditional format', () => {
  it('less than', () => {
    const formatter = new TextRenderer('[<123]"TRUE";"FALSE"')
    expect(formatter.formatNumber(122)).toEqual("TRUE")
    expect(formatter.formatNumber(123)).toEqual("FALSE");
    expect(formatter.formatNumber(124)).toEqual("FALSE");
  })
  it('greater than', () => {
    const formatter = new TextRenderer('[>123]"TRUE";"FALSE"')
    expect(formatter.formatNumber(122)).toEqual("FALSE")
    expect(formatter.formatNumber(123)).toEqual("FALSE");
    expect(formatter.formatNumber(124)).toEqual("TRUE");
  })
  it('not greater than', () => {
    const formatter = new TextRenderer('[<=123]"TRUE";"FALSE"')
    expect(formatter.formatNumber(122)).toEqual("TRUE");
    expect(formatter.formatNumber(123)).toEqual("TRUE");
    expect(formatter.formatNumber(124)).toEqual("FALSE")
  })
  it('not less than', () => {
    const formatter = new TextRenderer('[>=123]"TRUE";"FALSE"')
    expect(formatter.formatNumber(122)).toEqual("FALSE")
    expect(formatter.formatNumber(123)).toEqual("TRUE");
    expect(formatter.formatNumber(124)).toEqual("TRUE");
  })
  it('not equals', () => {
    const formatter = new TextRenderer('[<>123]"TRUE";"FALSE"')
    expect(formatter.formatNumber(122)).toEqual("TRUE");
    expect(formatter.formatNumber(123)).toEqual("FALSE");
    expect(formatter.formatNumber(124)).toEqual("TRUE");
  })
  
  it('equals', () => {
    const formatter = new TextRenderer('[=123]"TRUE";"FALSE"')
    expect(formatter.formatNumber(122)).toEqual("FALSE");
    expect(formatter.formatNumber(123)).toEqual("TRUE");
    expect(formatter.formatNumber(124)).toEqual("FALSE");
  })
  it("Fall back when no condition matches", () => {
    expect(new TextRenderer('[<0]"negative"').formatNumber(10)).toEqual('10')
  })
})

describe('Integer masks', () => {
  it('phone number example', () => {
    expect(
      new TextRenderer('(###) ####-####').formatNumber(12312341234)
    ).toEqual('(123) 1234-1234')
    expect(
      new TextRenderer('####-####').formatNumber(12341234)
    ).toEqual('1234-1234')
  })
})

describe('Zero mask', () => {

  it('More integer digits than mask specifies', () => {
    const formatter = new TextRenderer('#')
    expect(formatter.formatNumber(1)).toEqual('1')
    expect(formatter.formatNumber(0)).toEqual('')
    expect(formatter.formatNumber(100)).toEqual('100')
  })

  it('Less integer digits than mask specifies', () => {
    const formatter = new TextRenderer('0###')
    expect(formatter.formatNumber(1)).toEqual('0001')
    expect(formatter.formatNumber(0)).toEqual('0000')
    expect(formatter.formatNumber(100)).toEqual('0100')
  })

  describe('Ellipsis of the integer part', () => {
    it('Number less than 1 with zero integer digit', () => {
      const formatter = new TextRenderer('#.##');
      expect(formatter._format_data[0].format.int.totalPositions).toEqual(1)
      expect(formatter._format_data[0].format.int.firstReserved).toEqual(null)
      expect(formatter.formatNumber(0.35)).toEqual('.35')
    })
  })

  describe('Format with pinned and optional digits |#.00#|', () => {
    const formatter = new TextRenderer('0.00#')
    it('required positions', () => {
      expect(formatter._format_data[0].format.decimal.lastReserved).toEqual(1)
      expect(formatter._format_data[0].format.decimal.totalPositions).toEqual(3)
    })
    it('Rounding nearest (up)', () => {
      expect(formatter.formatNumber(0.98765)).toEqual('0.988')
    })
    it('Rounding nearest (down)', () => {
      expect(formatter.formatNumber(0.12345)).toEqual('0.123')
    })
    it('Hiding unpinned digit', () => {
      expect(formatter.formatNumber(1.23000)).toEqual('1.23')
    })
    it('Padding with zero the pinned digits', () => {
      expect(formatter.formatNumber(42)).toEqual('42.00')
    })
  })
  
  describe('Place a minus for simple formats and negative numbers', () => {
    it('Trivial number format', () => {
      expect(new TextRenderer('0').formatNumber(-2)).toEqual('-2')
    })
    it('Masked number format', () => {
      expect(new TextRenderer('"abc"#\\x\\#0').formatNumber(-14)).toEqual("-abc1x#4")
    })
    it('Simply text', () => {
      expect(new TextRenderer('"text"').formatNumber(-1)).toEqual("-text")
    })
  })
  describe('Rounding and padding negative numbers', () => {
    const formatter = new TextRenderer('0.00#')
    it('Rounding nearest (down)', () => {
      expect(formatter.formatNumber(-0.98765)).toEqual('-0.988')
    })
    it('Rounding nearest (up)', () => {
      expect(formatter.formatNumber(-0.12345)).toEqual('-0.123')
    })
    it('Hiding unpinned digit', () => {
      expect(formatter.formatNumber(-1.23000)).toEqual('-1.23')
    })
    it('Padding with zero the pinned digits', () => {
      expect(formatter.formatNumber(-42)).toEqual('-42.00')
    })
  })
})

describe('Percentage', () => {
  it('No decimals', () => {
    expect(new TextRenderer('0%').formatNumber(0.244740088)).toEqual('24%')
  })
  it('1 decimal', () => {
    expect(new TextRenderer('0.0%').formatNumber(0.244740088)).toEqual('24.5%')
  })
  it('2 decimals', () => {
    expect(new TextRenderer('0.00%').formatNumber(0.244740088)).toEqual('24.47%')
  })
})

describe('Thousand factors', () => {
  it('positive integral thousands rounding down', () => {
    expect(new TextRenderer('0,k').formatNumber(12345)).toEqual('12k')
  })
  it('positive integral thousands rounding up', () => {
    expect(new TextRenderer('0,k').formatNumber(45678)).toEqual('46k')
  })
  it('negative integral thousands rounding up', () => {
    expect(new TextRenderer('0,k').formatNumber(-12345)).toEqual('-12k')
  })
  it('positive integral thousands rounding down', () => {
    expect(new TextRenderer('0,k').formatNumber(-45678)).toEqual('-46k')
  })

  it('positive integral thousands with decimal digits', () => {
    expect(new TextRenderer('0.00,k').formatNumber(12345)).toEqual('12.35k')
  })
  it('positive integral thousands rounding down', () => {
    expect(new TextRenderer('0.00,k').formatNumber(-45678)).toEqual('-45.68k')
  })
  it('thousands percent', () => {
    expect(new TextRenderer('0.0,%').formatNumber(17)).toEqual("1.7%")
  })
})

describe('Thousand separators', () => {
  describe('Minimal example', () => {
    it('1-digit #,#', () => {
      const formatter = new TextRenderer('#,#')
      expect(formatter._format_data[0].format.int.firstReserved).toEqual(null)
      expect(formatter._format_data[0].format.int.lastReserved).toEqual(null)
      expect(formatter._format_data[0].format.int.totalPositions).toEqual(2)
      expect(formatter.formatNumber(1)).toEqual('1')
    })
    it('2-digit #,#', () => {
      expect(new TextRenderer('#,#').formatNumber(11)).toEqual('11')
    })
    it('3-digit #,#', () => {
      expect(new TextRenderer('#,#').formatNumber(111)).toEqual('111')
    })
    it('4-digit #,#', () => {
      expect(new TextRenderer('#,#')._format_data[0].format.thousandSeparator).toEqual(',')
      expect(new TextRenderer('#,#').formatNumber(1111)).toEqual('1,111')
    })
    it('5-digit #,#', () => {
      expect(new TextRenderer('#,#').formatNumber(11111)).toEqual('11,111')
    })
    it('6-digit #,#', () => {
      expect(new TextRenderer('#,#').formatNumber(111111)).toEqual('111,111')
    })
    
    it('7-digit #,#', () => {
      expect(new TextRenderer('#,#').formatNumber(1111111)).toEqual('1,111,111')
    })
    it('8-digit #,#', () => {
      expect(new TextRenderer('#,#').formatNumber(11111111)).toEqual('11,111,111')
    })
    it('9-digit #,#', () => {
      expect(new TextRenderer('#,#').formatNumber(111111111)).toEqual('111,111,111')
    })
    it('10-digit #,#', () => {
      expect(new TextRenderer('#,#').formatNumber(1111111111)).toEqual('1,111,111,111')
    })
  })
  it('1-digit 0,0', () => {
    const formatter = new TextRenderer('0,0')
    expect(formatter._format_data[0].format.int.firstReserved).toEqual(0)
    expect(formatter._format_data[0].format.int.lastReserved).toEqual(1)
    expect(formatter._format_data[0].format.int.totalPositions).toEqual(2)
    expect(formatter.formatNumber(1)).toEqual('01')
  })
})

describe('Literal comma', () => {
  // If the comma does not follow a digit separator it is a a literal
  it('leading comma', () => {
    expect(new TextRenderer(',0').formatNumber(12345678)).toEqual(',12345678')
  })
  it('comma in the middle', () => {
    expect(new TextRenderer('0 ,0').formatNumber(12345678)).toEqual('1234567 ,8')
  })
  it('comma at the end', () => {
    expect(new TextRenderer('0-,').formatNumber(12345678)).toEqual('12345678-,')
  })
})

describe('Scientific notation', () => {
  describe('positive numbers 1 leading digit with explicit exponent sign', () => {
    it('1.00E+0', () => {
      expect(new TextRenderer('0.00E+0').formatNumber(1)).toEqual('1.00E+0')
    })
    it('1.00E+1', () => {
      const formatter = new TextRenderer('0.00E+0')
      // this will determine the alignment
      expect(formatter._format_data[0].format.type).toEqual('scientific')
      expect(formatter._format_data[0].format.mantissa.int.totalPositions).toEqual(1)
      expect(formatter.formatNumber(10)).toEqual('1.00E+1');
    })
    it('1.00E+2', () => {
      expect(new TextRenderer('0.00E+0').formatNumber(100)).toEqual('1.00E+2');
    })
    it('1.23E+12', () => {
      expect(new TextRenderer('0.00E+0').formatNumber(123e10)).toEqual('1.23E+12');
    })
    it('5.00E-1', () => {
      expect(new TextRenderer('0.00E+0').formatNumber(0.5)).toEqual('5.00E-1');
    })
    it('9.87E-11', () => {
      expect(new TextRenderer('0.00E+0').formatNumber(987e-13)).toEqual('9.87E-11');
    })
  })

  describe('negative numbers 1 leading digit with explicit exponent sign', () => {
    it('-1.00E+0', () => {
      expect(new TextRenderer('0.00E+0').formatNumber(-1)).toEqual('-1.00E+0')
    })
    it('-1.00E+1', () => {
      expect(new TextRenderer('0.00E+0').formatNumber(-10)).toEqual('-1.00E+1');
    })
    it('-1.00E+2', () => {
      expect(new TextRenderer('0.00E+0').formatNumber(-100)).toEqual('-1.00E+2');
    })
    it('-1.23E+12', () => {
      expect(new TextRenderer('0.00E+0').formatNumber(-123e10)).toEqual('-1.23E+12');
    })
    it('-5.00E-1', () => {
      expect(new TextRenderer('0.00E+0').formatNumber(-0.5)).toEqual('-5.00E-1');
    })
    it('-9.87E-11', () => {
      expect(new TextRenderer('0.00E+0').formatNumber(-987e-13)).toEqual('-9.87E-11');
    })
  })

  describe('positive numbers with 1 leading digit with implicit exponent sign', () => {
    it('1.00E0', () => {
      expect(new TextRenderer('0.00E-0').formatNumber(1)).toEqual('1.00E0')
    })
    it('1.00E1', () => {
      expect(new TextRenderer('0.00E-0').formatNumber(10)).toEqual('1.00E1');
    })
    it('1.00E2', () => {
      expect(new TextRenderer('0.00E-0').formatNumber(100)).toEqual('1.00E2');
    })
    it('1.23E12', () => {
      expect(new TextRenderer('0.00E-0').formatNumber(123e10)).toEqual('1.23E12');
    })
    it('5.00E-1', () => {
      expect(new TextRenderer('0.00E-0').formatNumber(0.5)).toEqual('5.00E-1');
    })
    it('9.87E-11', () => {
      expect(new TextRenderer('0.00E-0').formatNumber(987e-13)).toEqual('9.87E-11');
    })
  })

  describe('Aligned at hundred powers', () => {
    it('1e0', () => {
      expect(new TextRenderer('##E-0').formatNumber(1)).toEqual('1E0')
    })
    it('20e0', () => {
      expect(new TextRenderer('##E-0').formatNumber(20)).toEqual('20E0')
    })
    it('99e0', () => {
      expect(new TextRenderer('##E-0').formatNumber(99)).toEqual('99E0')
    })
    it('1e2', () => {
      expect(new TextRenderer('##E-0').formatNumber(100)).toEqual('1E2')
    })
    it('30e2', () => {
      expect(new TextRenderer('##E-0').formatNumber(3000)).toEqual('30E2')
    })
    it('70e-4', () => {
      expect(new TextRenderer('##E-0').formatNumber(0.007)).toEqual('70E-4')
    })
    it('-40e2', () => {
      expect(new TextRenderer('##E-0').formatNumber(-4000)).toEqual('-40E2')
    })
    it('-80e-4', () => {
      expect(new TextRenderer('##E-0').formatNumber(-0.008)).toEqual('-80E-4')
    })
  })
  
  describe('Aligned at multiple of thousand', () => {
    it('1e0', () => {
      expect(new TextRenderer('###E-0').formatNumber(1)).toEqual('1E0')
    })
    it('20e0', () => {
      expect(new TextRenderer('###E-0').formatNumber(20)).toEqual('20E0')
    })
    it('99e0', () => {
      expect(new TextRenderer('###E-0').formatNumber(99)).toEqual('99E0')
    })
    it('1e2', () => {
      expect(new TextRenderer('###E-0').formatNumber(100)).toEqual('100E0')
    })
    it('3E3', () => {
      expect(new TextRenderer('###E-0').formatNumber(3000)).toEqual('3E3')
    })
    it('7E-3', () => {
      expect(new TextRenderer('###E-0').formatNumber(0.007)).toEqual('7E-3')
    })
    it('-4E2', () => {
      expect(new TextRenderer('###E-0').formatNumber(-4000)).toEqual('-4E3')
    })
    it('-8E3', () => {
      expect(new TextRenderer('###E-0').formatNumber(-0.008)).toEqual('-8E-3')
    })
    it('3E3', () => {
      expect(new TextRenderer('###E-0').formatNumber(3000)).toEqual('3E3')
    })
    it('700E-6', () => {
      expect(new TextRenderer('###E-0').formatNumber(0.0007)).toEqual('700E-6')
    })
    it('-400E3', () => {
      expect(new TextRenderer('###E-0').formatNumber(-400000)).toEqual('-400E3')
    })
    it('-80E-6', () => {
      expect(new TextRenderer('###E-0').formatNumber(-0.00008)).toEqual('-80E-6')
    })
  })
  it('aligned & padded', () => {
    expect(new TextRenderer('000.00E+0').formatNumber(12300)).toEqual('012.30E+3')
  })
  it('Using # in the exponent', () => {
    expect(new TextRenderer('0E+##').formatNumber(2)).toEqual('2E+0')
  })
  it('Using ? in the exponent', () => {
    expect(new TextRenderer('0E+??').formatNumber(3)).toEqual('3E+0')
  })
  describe('Masked exponent', () => {
    it('1e123 as 1e1-2/3', () => {
      // It accepts unescaped, excel rejects this case
      expect(new TextRenderer('0E-0-0\\/0').formatNumber(1e123)).toEqual('1E1-2/3')
      expect(new TextRenderer('0E-0\\-0\\/0').formatNumber(1e123)).toEqual('1E1-2/3')
    })
  })
})

describe('Fractions', () => {
  it('1 1/2', () => {
    expect(new TextRenderer('# #/#').formatNumber(1.5)).toEqual('1 1/2')
  })
  it('3/2', () => {
    expect(new TextRenderer('#/#').formatNumber(1.5)).toEqual('3/2')
  })
  it('PI ~ 3 16/113', () => {
    expect(new TextRenderer('# #/###').formatNumber(Math.PI)).toEqual('3 16/113')
  })
  it('PI ~ 3 16/113', () => {
    expect(new TextRenderer('# #/###').formatNumber(Math.PI)).toEqual('3 16/113')
  })
  it('1/7', () => {
    expect(new TextRenderer('#/#').formatNumber(1/7)).toEqual('1/7')
  })
  it('-PI ~ -1146408/364913', () => {
    expect(new TextRenderer('#/######').formatNumber(-Math.PI)).toEqual('-1146408/364913')
  })
  /**
   * Apply fn to all the p0,q0 such that 0 < p0/q0 < 1
   * and gcd(p0, q0) = 1 where q0 <= maxDenominator
   * @param {Function} fn 
   * @param {number} maxDenominator
   * @returns 
   */
  function fracApply(fn, maxDenominator, p0=0, q0=1, p1=1, q1=1){
    if(q0 > maxDenominator){
      return
    }
    if(0 < p0 && p0 < q0){
      fn(p0, q0)
    }
    fracApply(fn, maxDenominator, p0 + p1, q0 + q1, p0, q0)
    fracApply(fn, maxDenominator, p0 + p1, q0 + q1, p1, q1)
  }
  it('All 1-digit fractions', () => {
    const fmt = new TextRenderer('#/#')
    const check = (p0, q0) => {
      expect(fmt.formatNumber(p0/q0)).toEqual(`${p0}/${q0}`);
    }
    fracApply(check, 9)
  })
  
  it('2-digit fractions', () => {
    const fmt = new TextRenderer('#/#####')
    const check = (p0, q0) => {
      expect(fmt.formatNumber(p0/q0)).toEqual(`${p0}/${q0}`);
    }
    fracApply(check, 300, 0, 1, 1, 10)
  })
  it('Masked denominator', () => {
    expect(new TextRenderer('#/#\\a#\\b#\\c#').formatNumber(1233/1234)).toEqual('1233/1a2b3c4')
  })
  it('Masked numerator', () => {
    // This example does not work properly in excel as well, it drops the 'c'
    expect(new TextRenderer('#\\a#\\b#\\c#/####').formatNumber(1233/1234)).toEqual('abc1233/1234')
    // expect(new TextRenderer('/####').formatNumber(1233/1234)).toEqual('ab1233c/1234')
    expect(new TextRenderer('0\\a0\\b0\\c0/####').formatNumber(1233/1234)).toEqual('0a0b0c1233/1234')
  })

})

describe('Date serialization', () => {
  it('today()', () => {
    const dateFormat = new TextRenderer('dd/mm/yyyy');
    expect(dateFormat._format_data[0].format.type).toEqual('datetime')
    expect(dateFormat.formatNumber(44456.000)).toEqual('17/09/2021')
    expect(dateFormat.formatNumber(44456.999)).toEqual('17/09/2021')
  })
})