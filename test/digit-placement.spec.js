const {TextRenderer} = require("../src/text-renderer");


describe("How digits are assigned", () => {
  function assignedDigits(s){
    return new TextRenderer(s).format[0].parts;
  }
  it("Fractional format 0.000", () => {
    const parts = assignedDigits("0.000");
    expect(parts.map(p => p.firstDigit)).toEqual([
      undefined,
      undefined,
      -1,
      -2,
      -3
    ]);
    expect(parts.map(p => p.lastDigit)).toEqual([0, undefined, -1, -2, -3]);
  });
  it("Percent format 0.0%", () => {
    expect(new TextRenderer("0.0%").format[0].meta.displayFactor).toEqual(100)
  });
  it("Numbers with trailing commas", () => {
    expect(new TextRenderer("0,,\\M").format[0].meta.displayFactor).toEqual(1e-6)
  })
  it("Masked integer format", () => {
    const parts = assignedDigits("000-00-0000");
    expect(parts.map(p => p.firstDigit)).toEqual([
      undefined,
      7,
      6,
      undefined,
      5,
      4,
      undefined,
      3,
      2,
      1,
      0
    ]);
    expect(parts.map(p => p.lastDigit)).toEqual([
      8,
      7,
      6,
      undefined,
      5,
      4,
      undefined,
      3,
      2,
      1,
      0
    ]);
  });
  it('Masked format with percent symbols', () => {
    expect(new TextRenderer("000-00-0000%%").format[0].meta.displayFactor).toEqual(10000)
  })
});
describe('Range of possibly displayed digits', () => {
  it('###.00##', () => {
    const formatter = new TextRenderer('###.00##')
    expect(formatter.format[0].meta.requiredIntegerDigits).toBe(1)
    expect(formatter.format[0].meta.requiredDecimalDigits).toBe(2)
    expect(formatter.format[0].meta.displayedDecimalDigits).toBe(4)
  })
})
