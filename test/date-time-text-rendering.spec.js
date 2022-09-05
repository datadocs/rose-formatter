const {TextRenderer} = require('../src/text-renderer')



const refDate = new Date(2021, 7, 5, 14, 3, 9, 256)

const beforeMidnight =  new Date(2020, 11, 31, 23, 59, 59, 256)
const afterMidnight =  new Date(2021, 11, 31, 0, 0, 0, 2)
const beforeNoon =  new Date(2020, 11, 31, 11, 59, 59, 256)
const afterNoon =  new Date(2021, 11, 31, 12, 0, 0, 2)
const after1pm =  new Date(2021, 11, 31, 13, 0, 0, 0)
const before1pm =  new Date(2021, 11, 31, 12, 59, 59, 999)
const before1am =  new Date(2021, 11, 31, 0, 59, 59, 999)
const after1am =  new Date(2021, 11, 31, 1, 0, 0, 0)
describe("Date & Time", () => {
  it('Normalize year in format |mm/dd/yyy|', () => {
    expect(new TextRenderer("mm/dd/yyy").formatDate(refDate)).toEqual(
      '08/05/2021'
    );
  })
  it('Short year format |mm/dd/yy|', () => {
    expect(new TextRenderer("mm/dd/yy").formatDate(refDate)).toEqual(
      '08/05/21'
    );
  })
  it('Polysemic nature of `m` place holder', () => {
    expect(new TextRenderer("m/d/yyyy h:mm AM/PM").formatDate(refDate)).toEqual('8/5/2021 2:03 pm')
  })
  it('Representation of time format |m s|', () => {
    expect(new TextRenderer("m s").formatDate(refDate)).toEqual('3 9')
  })
  it('Representation of time format |h m|', () => {
    expect(new TextRenderer("h m").formatDate(refDate)).toEqual('14 3')
  })
  it('Representation of time format |m h|', () => {
    expect(new TextRenderer("m h").formatDate(refDate)).toEqual('8 14')
  })

  it('M as month after am/pm for compatibility with excel interpretation of format |am/pm m|', () => {
    expect(new TextRenderer("am/pm m").formatDate(refDate)).toEqual('pm 8')
  })
  it('m as minute after a placeholder form seconds in format |s m|', () => {
    expect(new TextRenderer("s m").formatDate(refDate)).toEqual('9 3')
  })
  it('m as month by default', () => {
    expect(new TextRenderer("m").formatDate(refDate)).toEqual('8')
  })
});

describe('Hidden chars in date', () => {
  it('hide one char after year', () => 
    expect(new TextRenderer('y_)x').formatDate(refDate)).toEqual('21 x')
  )
})

describe('Month and week day names', () => {
  it('week day and month name', () => {
    expect(new TextRenderer('dddd, dd of mmmm of yyyy').formatDate(refDate)).toEqual(
      'Thursday, 05 of August of 2021'
    )
  })
  it('short week day and month name', () => {
    expect(new TextRenderer('ddd, mmm dd - yyyy').formatDate(refDate)).toEqual(
      'Thu, Aug 05 - 2021'
    )
  })
  it('Month initial', () => {
    expect(new TextRenderer('mmmm "starts with the letter" mmmmm').formatDate(refDate)).toEqual(
      'August starts with the letter A'
    )
  })
})

describe('Midnight', () => {
  it('formats 11pm correctly', () => {
    expect(new TextRenderer('hham/pm').formatDate(beforeMidnight)).toEqual('11pm')
  })
  it('formats 12pm correctly', () => {
    expect(new TextRenderer('hham/pm').formatDate(afterMidnight)).toEqual('12pm')
    expect(new TextRenderer('hham/pm').formatDate(before1am)).toEqual('12pm')
  })
  it('formats 1am correctly', () => {
    expect(new TextRenderer('hham/pm').formatDate(after1am)).toEqual('01am')
  })
  it('formats 12pm correctly', () => {
    expect(new TextRenderer('hham/pm').formatDate(afterMidnight)).toEqual('12pm')
  })
  
  it('formats 11p correctly', () => {
    expect(new TextRenderer('hha/p').formatDate(beforeMidnight)).toEqual('11p')
  })
  it('formats 12p correctly', () => {
    expect(new TextRenderer('hha/p').formatDate(afterMidnight)).toEqual('12p')
    expect(new TextRenderer('hha/p').formatDate(before1am)).toEqual('12p')
  })
  it('formats 1a correctly', () => {
    expect(new TextRenderer('hha/p').formatDate(after1am)).toEqual('01a')
  })
  it('formats 12p correctly', () => {
    expect(new TextRenderer('hha/p').formatDate(afterMidnight)).toEqual('12p')
  })
  it('formats 23 correctly', () => {
    expect(new TextRenderer('hh').formatDate(beforeMidnight)).toEqual('23')
  })
  it('formats 00 correctly', () => {
    expect(new TextRenderer('hh').formatDate(afterMidnight)).toEqual('00')
  })
})

describe('Noon', () => {
  it('formats 11am correctly', () => {
    expect(new TextRenderer('hham/pm').formatDate(beforeNoon)).toEqual('11am')
  })
  it('formats 12am correctly', () => {
    expect(new TextRenderer('hham/pm').formatDate(afterNoon)).toEqual('12am')
    expect(new TextRenderer('hham/pm').formatDate(before1pm)).toEqual('12am')
  })
  it('formats 1pm correctly', () => {
    expect(new TextRenderer('hham/pm').formatDate(after1pm)).toEqual('01pm')
  })
  it('formats 11a correctly', () => {
    expect(new TextRenderer('hha/p').formatDate(beforeNoon)).toEqual('11a')
  })
  it('formats 12a correctly', () => {
    expect(new TextRenderer('hha/p').formatDate(afterNoon)).toEqual('12a')
    expect(new TextRenderer('hha/p').formatDate(before1pm)).toEqual('12a')
  })
  it('formats 1p correctly', () => {
    expect(new TextRenderer('hha/p').formatDate(after1pm)).toEqual('01p')
  })
  it('formats 11 correctly', () => {
    expect(new TextRenderer('hh').formatDate(beforeNoon)).toEqual('11')
  })
  it('formats 12 correctly', () => {
    expect(new TextRenderer('hh').formatDate(afterNoon)).toEqual('12')
  })
})

describe("Time spans", () => {
  const d = 1;
  const h = d / 24;
  const m = h / 60;
  const s = m / 60;
  const ms = s / 1000;

  
  describe("Ellapsed hours", () => {
    describe('More than one day', () => {
      it('without leading zeroes', () => {
        expect(new TextRenderer("[h] m").formatNumber((100*h + 25*m)))
          .toEqual('100 25')
      })
      it('with leading zeros', () => {
        expect(new TextRenderer("[hhhh] m").formatNumber((100*h + 25*m)))
          .toEqual('0100 25')
      })
    })
    it('less than 10 hours', () => {
      expect(new TextRenderer("[h] m").formatNumber((h + 25*m)))
        .toEqual('1 25')
    })
  })
  describe("Ellapsed minutes", () => {
    describe('More than one hour', () => {
      it('without leading zeroes', () => {
        expect(new TextRenderer("[m] s").formatNumber((100*m + 25*s)))
          .toEqual('100 25')
      })
      it('with leading zeros', () => {
        expect(new TextRenderer("[mmmm] s").formatNumber((100*m + 25*s)))
          .toEqual('0100 25')
      })
    })
    it('less than 10 minutes', () => {
      expect(new TextRenderer("[m] s").formatNumber((m + 25*s)))
        .toEqual('1 25')
    })
  })
  describe("Ellapsed seconds", () => {
    describe('More than one minute', () => {
      it('without leading zeroes', () => {
        expect(new TextRenderer("[s].00").formatNumber((100*s + 250*ms)))
          .toEqual('100.25')
      })
      it('with leading zeros', () => {
        expect(new TextRenderer("[ssss].00").formatNumber((100*s + 250*ms)))
          .toEqual('0100.25')
      })
    })
    it('less than 10 seconds', () => {
      expect(new TextRenderer("[s].00").formatNumber((s + 250*ms)))
        .toEqual('1.25')
    })
  })


})