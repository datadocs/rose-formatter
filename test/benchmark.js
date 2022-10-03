const BenchTable = require('benchtable')
const numbersSuite = new BenchTable('Number formatting', {isTransposed: true});
const xl1 = require('excel-style-dataformatter');
const rose = require('../dist/index');
const xlf = new xl1();
const formatCache = {}
numbersSuite
  .addFunction("excel-style-dataformatter", (value, format) => {
    xlf.format(value, 'Number', format);
  })
  .addFunction("rose-format render", (value, format) => {
    return (formatCache[format] || (formatCache[format] = new rose.TextRenderer(format))).formatNumber(value);
  })
  .addInput('Integer mask', [2398472398, '00-00-00\\.00.00\\/000\\/000'])
  .addInput('Decimal digits', [Math.PI, '0000.0000000000'])
  .addInput('Fractions', [Math.PI, '# #/###'])
  .addInput('Thousand separators', [12345678903, '0,'])
  .addInput('Scientific notation', [12345678903, '000E+0'])
  .addInput('Percentage', [12345678903, '0%%%'])
  .on('cycle', event => {
    console.log(event.target.toString())
  })
  .on('complete', () => {
    console.log(numbersSuite.table.toString());
    console.log('Fastest is ' + numbersSuite.filter('fastest').map('name'));
    console.log(benchTableHTML(numbersSuite.table))
  })
  .run({async: false})

function benchTableHTML(table){
  html = ['<table>\n  <tr>']
  html.push(table.options.head.map(s => `\n    <th>${s}</th>`).join('') + '\n  </tr>')
  for(let i = 0; i < table.length; ++i){
    for(const k in table[i]){
      if(Object.hasOwnProperty.call(table[i], k)){
        html.push('\n  <tr>' + table[i][k].map(c => `\n    <td>${c}</td>`).join('') + '\n  </tr>')
      }
    }
  }
  html.push('\n</table>')
  return html.join('')  
}
