const {TextRenderer} = require('../dist/index')
const {Locales} = require('../dist/index')

const refDate = new Date(2021, 7, 5, 14, 3, 9, 256)

for (const localeKey in Locales) {
    const locale = Locales[localeKey]
    describe(`Month and week day names in [${locale}]`, () => {
        it('Week day and month name', () => {
            expect(new TextRenderer('dddd, dd of mmmm of yyyy', localeKey).formatDate(refDate)).toEqual(
                `${locale.weekDays[4]}, 05 of ${locale.monthNames[7]} of 2021`
            )
        })
        it('Short week day and month name', () => {
            expect(new TextRenderer('ddd, mmm dd - yyyy', localeKey).formatDate(refDate)).toEqual(
                `${locale.weekDays[4].substring(0, 3)}, ${locale.monthNames[7].substring(0, 3)} 05 - 2021`
            )
        })
    })

}
