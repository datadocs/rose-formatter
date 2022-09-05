const formatParser = require("../dist/index");

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

function collectTokens(){
  tokens = []
  
}

function assertToken(s) {

  it(s + " produces a single token", () => {
    const t = formatParser.parse(s);
    let nFound = 0;
    let exactlyMatched = 0
    const isToken = {
      time: true, date: true, digit: true, separator: true, percent: true, literal: true
    }
    function collectDeep(node){
      if(node.source && isToken[node.type]){
        nFound += 1;
        if(node.source.start === 0 && node.source.end === s.length && node.source.text === s){
          exactlyMatched = true
        }
      }else{
        for(const k in node){
          if(Object.hasOwnProperty.call(node, k) && 
            typeof node[k] === 'object' && 
            node[k]){
            collectDeep(node[k])
          }
        }
      }
    }
    collectDeep(t)
    expect(nFound).toEqual(1)
    expect(exactlyMatched).toEqual(true)
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
