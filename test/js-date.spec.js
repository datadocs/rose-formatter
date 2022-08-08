const tr = require('../src/text-renderer')

describe('Conversion', () => {
  it('excel to js date', () => {
    expect(tr.excelDateToJSDate(44781)).toEqual(new Date('2022-08-08'))
  })
  it('js date to excel', () => {
    expect(tr.excelDateToJSDate(new Date('2022-08-08'))).toEqual(44781)
  })
})