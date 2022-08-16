const formatParser = require("../src/parse-format");



class OneOf{
  constructor(values){
    this.values = values;
  }
  asymmetricMatch(other){
    return this.values.some(v => {
      try{
        expect(other).toEqual(v);
        return true;
      } catch {
        return false;
      }
    })
  }
  toString(){
    return 'oneOf([' + this.values.map(v => v.toString()).join(', ') + '])';
  }

}
function oneOf(v){
  return new OneOf(v)
}

const conditionBase = {
  isDate: expect.any(Boolean),
  clockHours: oneOf([12, 24]),
  percent: expect.any(Number),
  type: oneOf(['numeric', 'datetime'])
};

it('test one of', () => {
  expect(12).toEqual(oneOf([12, 24]))
})

function assertValid(s) {
  it("'" + s + "' is valid", () => expect(() => formatParser.parse(s)).not.toThrow())
}
function assertToken(s) {
  it(s + " produces a single token", () => {
    const t = formatParser.parse(s);
    expect(t).toStrictEqual([
      {
        ...conditionBase,
        condition: null,
        parts: [t[0].parts[0]]
      }
    ]);
  });
}

describe("syntax", () => {
  // Make sure that the parser recognizes the format syntax in the Excel TEXT function examples.
  // http://download.microsoft.com/download/6/A/8/6A818B0B-06F4-4E41-80DE-D383A3B89865/TEXT%20function%20examples.xlsx
  describe("numeric formats", () => {
    describe("Thousands separator", () => {
      assertToken("#");
      assertToken(",");
      assertToken("0");
      assertValid("#,###");
      assertValid("0,000.00");
      assertValid("#,");
      assertValid("#,000.0,");
      assertValid("0.0,,");
    });
    describe("Number, currency, accounting", () => {
      assertValid("0.00");
      assertValid("#,##0");
      assertValid("$#,##0");
      assertValid("$#,##0.00");
      assertValid("$,##0.00_);($#,##0.00)");
      assertValid("$ * #,##0");
      assertValid("$ * #,##0.00");
    });
    describe("Months, days, years", () => {
      assertToken("m");
      assertToken("mm");
      assertToken("mmm");
      assertToken("mmmm");
      assertToken("mmmmm");

      assertToken("d");
      assertToken("dd");
      assertToken("ddd");
      assertToken("dddd");

      assertToken("yy");
      assertToken("yyyy");
    });
    describe("Hours, minutes, seconds", () => {
      assertToken("h");
      assertToken("hh");
      assertToken("s");
      assertToken("ss");
      assertToken("[h]");
      assertToken("[m]");
      assertToken("[s]");
      assertToken("[hh]");
      assertToken("[mm]");
      assertToken("[ss]");
      // composed in time format
      assertValid("h AM/PM");
      assertValid("h:mm AM/PM");
      assertValid("h:mm:ss A/P");
      assertValid("h:mm:ss.00");
      assertValid("[h]:mm");
      assertValid("[mm]:ss");
      assertValid("[ss].00");
    });

    describe("Date & Time", () => {
      assertValid("mm/dd/yyy");
      assertValid("m/d/yyyy h:mm AM/PM");
    });

    describe("Percentage", () => {
      assertValid(".00_0%");
      assertValid("0.0%");
      assertValid("0.00%");
    });

    describe("Fraction", () => {
      assertValid("# ?/?");
      assertValid("# ??/??");
      assertValid("# ???/???");
      assertValid("# ?/2");
      assertValid("# ?/4");
      assertValid("# ??/16");
      assertValid("# ??/10");
      assertValid("# ??/100");
    });
    describe("Scientific notation", () => {
      assertValid("0.00E+00");
      assertValid("#0.0E+0");
    });
    describe("Special", () => {
      assertValid("00000");
      assertValid("[<=9999999]##-####;(###) ###-####");
      assertValid("000-00-0000");
    });
  });
});


describe("Produced tokens", () => {
  // Make sure that the parser recognizes the format syntax in the Excel TEXT function examples.
  // http://download.microsoft.com/download/6/A/8/6A818B0B-06F4-4E41-80DE-D383A3B89865/TEXT%20function%20examples.xlsx
  describe("numeric formats", () => {
    const alphabet = {
      '#': {type:'digit', mask: '#'},
      '0': {type:'digit', mask: '0'},
      ',': {type:'separator', mask:','},
      '.': {type:'separator',mask:'.'},
      '%': {type: 'separator', mask: '%'},
      'a/p': {type: 'time', mask: 'a/p'},
      'am/pm': {type: 'time', mask: 'am/pm'},
      '[h]': {type: 'time', mask: '[h]'},
      '[m]': {type: 'time', mask: '[m]'},
      '[s]': {type: 'time', mask: '[s]'},
      'h': {type: 'time', mask: 'h'},
      'hh': {type: 'time', mask: 'hh'},
      'm': {type: 'time', mask: 'm'},
      'mm': {type: 'time', mask: 'mm'},
      'mmm': {type: 'date', mask: 'mmm'},
      'mmmm': {type: 'date', mask: 'mmmm'},
      'd': {type: 'date', mask: 'd'},
      'dd': {type: 'date', mask: 'dd'},
      'ddd': {type: 'date', mask: 'ddd'},
      'dddd': {type: 'date', mask: 'dddd'},
      'M': {type: 'date', mask: 'm'},
      'MM': {type: 'date', mask: 'mm'},
      'yy': {type: 'date', mask: 'yy'},
      'yyyy': {type: 'date', mask: 'yyyy'},
      's': {type: 'time', mask: 's'},
      'ss': {type: 'time', mask: 'ss'},
      '[h]': {type: 'time', mask: '[h]', zfill: 1},
      '[m]': {type: 'time', mask: '[m]', zfill: 1},
      '[s]': {type: 'time', mask: '[s]', zfill: 1},
      '_0' : {type: 'hidden', mask: '0'}
    };
    const sourceStamp = {text: expect.any(String), start: expect.any(Number), end: expect.any(Number)}
    

    function condition(condition, tokens){
      return {
        ...conditionBase,
        condition: condition && {...condition, source:sourceStamp}, 
        parts: tokens.map(token => {
          return {
            source: sourceStamp,
            ... (alphabet[token] || (typeof token === 'string' ? {type: 'literal', mask: token}: token))
          }
        })
      }
    }
    describe('separators', () => {
      it('Representation of format |#,###|', () => {
        expect(formatParser.parse("#,###")).toEqual([
          condition(null, '#,###'.split(''))
        ])
      });
      it('Representation of |0,000.00|', () => {
        expect(formatParser.parse("0,000.00")).toEqual([
          condition(null, '0,000.00'.split(''))
        ]);
      })
      it('Representation of |#,|', () => {
        expect(formatParser.parse("#,")).toEqual([
          condition(null, '#,'.split(''))
        ]);
      })
      it('Representation of |#,000.0|', () => {
        expect(formatParser.parse("#,000.0")).toEqual([
          condition(null, '#,000.0'.split(''))
        ]);  
      })
      it('Representation of |0.0,,|', () => {
        expect(formatParser.parse("0.0,,")).toEqual([
          condition(null, '0.0,,'.split(''))
        ]);
      })
    })
    describe("Number, currency, accounting", () => {
      it('Representation of thousands separator format $#,##0', () => {
        expect(formatParser.parse("$#,##0")).toEqual([
          condition(null, '$#,##0'.split(''))
        ]);  
      })
      it('Representaion of dollar sign $#,##0', () => {
        expect(formatParser.parse("$#,##0")).toEqual([
          condition(null, '$#,##0'.split(''))
        ])
      });
      
      it('Representation of condtional format |$,##0.00_);($#,##0.00)|', () => {
        expect(formatParser.parse("$,##0.00_);($#,##0.00)")).toEqual([
          condition(null, ['$', ',', '#', '#', '0', '.', '0', '0',
                {type: 'hidden', mask: ')'}]),
          condition(null, '($#,##0.00)'.split(''))
        ]);
      })

      it('Representation filler (in accounting format) |$ * #,##0|', () => {
        expect(formatParser.parse("$ * #,##0")).toEqual([
          condition(null, ['$', {type: 'fill', mask:' '}, ' ', '#', ',', '#', '#', '0'])
        ]);
        expect(formatParser.parse("$ * #,##0.00")).toEqual([
          condition(null, ['$', {type: 'fill', mask:' '}, ' ', '#', ',', '#', '#', '0', '.', '0', '0'])
        ]);
      })
    });
    
    describe("Hours, minutes, seconds", () => {
      it('representation of 12 hours time format |h AM/PM|', () => {
        expect(formatParser.parse("h AM/PM")).toEqual([
          condition(null, ['h', ' ', 'am/pm'])
        ]);
      });
      it('Representation of 12 hours time format |h:mm AM/PM|', () => {
        expect(formatParser.parse("h:mm AM/PM")).toEqual([
          condition(null, ['h', ':', 'mm', ' ', 'am/pm'])
        ]);
      })
      it('Representation of 12 hours time format |h:mm:ss A/P|', () => {
        expect(formatParser.parse("h:mm:ss A/P")).toEqual([
          condition(null, ['h', ':', 'mm', ':', 'ss', ' ', 'a/p'])
        ]);
      });
      it('Representation of fraction of second |s.00|', () => {
        expect(formatParser.parse("h:mm:ss.00")).toEqual([
          condition(null, ['h', ':', 'mm', ':', 'ss', {type: 'time', mask:'.0', zfill: 2}])
        ]);
      })
    })
      
    describe('Ellapsed time representation', () => {
      it('Representation of elapsed hours and minutes [h]:mm', () => {
        expect(formatParser.parse("[h]:mm")).toEqual([
          condition(null, ['[h]', ':', 'mm'])
        ]);
      })
      it('Representation of elapsed minutes and seconds [m]:ss', () => {
        expect(formatParser.parse("[m]:ss")).toEqual([
          condition(null, ['[m]', ':', 'ss'])
        ]);
      })
      it('Representation of elapsed time in seconds', () => {
        expect(formatParser.parse("[s].00")).toEqual([
          condition(null, ['[s]', {type: 'time', mask:'.0', zfill: 2}])
        ]);
      })
    })

    describe("Date & Time", () => {
      it('Normalize year in format |mm/dd/yyy|', () => {
        expect(formatParser.parse("mm/dd/yyy")).toEqual([
          condition(null, ['MM', '/', 'dd', '/', 'yyyy'])
        ]);
      })
      it('Polysemic nature of `m` place holder', () => {
        expect(formatParser.parse("m/d/yyyy h:mm AM/PM")).toEqual([
          condition(null, ['M', '/', 'd', '/', 'yyyy', ' ', 'h', ':', 'mm', ' ', 'am/pm'])
        ])
      })
      it('Representation of time format |m s|', () => {
        expect(formatParser.parse("m s")).toEqual([
          condition(null, ['m', ' ', 's'])
        ])
      })
      it('Representation of time format |h m|', () => {
        expect(formatParser.parse("h m")).toEqual([
          condition(null, ['h', ' ', 'm'])
        ])
      })
      it('Representation of time format |m h|', () => {
        expect(formatParser.parse("m h")).toEqual([
          condition(null, ['M', ' ', 'h'])
        ])
      })

      it('M as month after am/pm for compatibility with excel interpretation of format |am/pm m|', () => {
        expect(formatParser.parse("am/pm m")).toEqual([
          condition(null, ['am/pm', ' ', 'M'])
        ])
      })
      it('m as minute after a placeholder form seconds in format |s m|', () => {
        expect(formatParser.parse("s m")).toEqual([
          condition(null, ['s', ' ', 'm'])
        ])
      })
      it('m as month by default', () => {
        expect(formatParser.parse("m")).toEqual([
          condition(null, ['M'])
        ])
      })
      it('[m] is elapsed minute', () => {
        expect(formatParser.parse("[m]")).toEqual([
          condition(null, ['[m]'])
        ])
      })
      
    });

    describe("Percentage", () => {
      it('tokenization of .00_0%', () => {
        expect(formatParser.parse(".00_0%")).toEqual([
          condition(null, '.|0|0|_0|%'.split('|'))
        ]);
      })
      
      it('tokenization of 0.0%', () => {
        expect(formatParser.parse("0.0%")).toEqual([
          condition(null, '0.0%'.split(''))
        ]);
      })
      
      it('tokenization of 0.00%', () => {
        expect(formatParser.parse("0.00%")).toEqual([
          condition(null, '0.00%'.split(''))
        ]);
      })
    });

    describe("Fraction", () => {
      assertValid("# ?/?");
      assertValid("# ??/??");
      assertValid("# ???/???");
      assertValid("# ?/2");
      assertValid("# ?/4");
      assertValid("# ??/16");
      assertValid("# ??/10");
      assertValid("# ??/100");
    });
    describe("Scientific notation", () => {
      it('0.00E+00', () => {
        expect(formatParser.parse("0.00E+00")).toEqual(
         [condition(null, ['0', '.', '0', '0', {type:'exponent', sign: '+', mask: expect.any(Array)}])]
        );
      })
      it('#0.00E+0', () => {
        expect(formatParser.parse("#0.00E+0")).toEqual(
         [condition(null, ['#', '0', '.', '0', '0', {type:'exponent', sign: '+', mask: expect.any(Array)}])]
        );
      })
      
    });

    describe("Special", () => {
      it("00000", () => {
        expect(formatParser.parse("00000")).toEqual([
          condition(null, '00000'.split(''))
        ])
      });
      
      it('Parse phone number format example', () => {
        expect(formatParser.parse("[<=9999999]##-####")).toEqual([
          condition({compare: '<=', value:9999999}, '##-####'.split('')),
        ])
        expect(formatParser.parse("(###) ###-####")).toEqual([
          condition(null, '(###) ###-####'.split(''))
        ])
        expect(formatParser.parse("[<=9999999]##-####;(###) ###-####")).toEqual([
          condition({compare: '<=', value:9999999}, '##-####'.split('')),
          condition(null, '(###) ###-####'.split(''))
        ])
        
      });

      it('Parse Social Security Number format example', () => {
        const x = formatParser.parse("000-00-0000")
        const y = [condition(null, '000-00-0000'.split(''))]
        for(let i = 0; i < x[0].parts.length; ++i){
          const a = x[0].parts[i]
          const b = y[0].parts[i]
          expect(a).toEqual(b)
        }
        expect(x).toEqual(y);
      })
    });
  });
});