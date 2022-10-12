
const BenchTable = require('benchtable')
const numbersSuite = new BenchTable('Number formatting', { isTransposed: true });
const xl1 = require('excel-style-dataformatter');
const rose = require('../dist/index');
const xlf = new xl1();
const formatCache = {}
const compiledFormatCache = {}
const fs = require('fs')
const D3Node = require('d3-node');

const defaultMargins = ({ xAxis, yAxis } = {}) => ({
  top: 20,
  right: 20,
  bottom: (xAxis ? 0 : 30) + 60,
  left: yAxis ? 60 : 50,
})

function bar({
  series,
  labels,
  legend,
  selector: _selector = '#chart',
  container: _container = `
    <div id="container">
      <h2>Bar Chart</h2>
      <div id="chart"></div>
    </div>
  `,
  style: _style = '',
  width: _width = 960,
  height: _height = 500,
  margin: _margin = defaultMargins(arguments[0].labels),
  barColor: _barColor = 'steelblue',
  barHoverColor: _barHoverColor = 'brown',
  labels: _labels = { xAxis: '', yAxis: '' },
} = {}) {
  const _svgStyles = `
    .bar:hover { fill: ${_barHoverColor}; }
  `;

  const d3n = new D3Node({
    selector: _selector,
    styles: _svgStyles + _style,
    container: _container,
  });

  const d3 = d3n.d3;

  const width = _width - _margin.left - _margin.right;
  const height = _height - _margin.top - _margin.bottom;

  const maxHeight = d3.max(series, s => d3.max(s));
  // set the ranges
  const x = d3.scaleBand()
    .range([0, width])
    .padding(0.1);

  const y = d3.scaleLinear()
    .range([height, 0]);

  const svg = d3n.createSVG(_width, _height)
    .append('g')
    .attr('transform', `translate(${_margin.left}, ${_margin.top})`);

  x.domain(labels.x);
  y.domain([0, maxHeight]);

  // append the rectangles for the bar chart
  const N = series.length;
  w = x.bandwidth();
  series.forEach((s, i) => {
    svg.selectAll('.bar')
      .data(s)
      .enter().append('rect')
      .attr('x', (d, j) => x(labels.x[j]) + (i + 0.5) * w / (N + 1))
      .attr('width', 0.9 * w / (N + 1))
      .attr('y', (d) => y(d))
      .attr('height', (d) => y(maxHeight - d))
      .style('fill', d3.schemeCategory10[i])
  })
  // add the x Axis
  svg.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .style('text-anchor', 'end')
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr('transform', 'rotate(-20)');

  // text label for the x Axis
  svg.append('text')
    .attr('transform', `translate(${width / 2}, ${height + _margin.bottom - 5})`)
    .style('text-anchor', 'middle')
    .text(_labels.xAxis);

  // add the y Axis
  svg.append('g').call(d3.axisLeft(y))

  // text label for the y Axis
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - _margin.left)
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .text(_labels.yAxis);

  return { d3n, svg };
}


numbersSuite

  .addFunction("rose-format compiled render", (value, format, type = 'Number') => {
    try{
      const t = compiledFormatCache[format] || (compiledFormatCache[format] = (new rose.CompiledTextRenderer(format)).formatNumber);
      return type === 'Number' ?
        t(value) :
        null;
    }catch(e){
      console.log(compiledFormatCache[format].toString())
      console.log(e.toString());
      throw e;
    }
  })
  .addFunction("rose-format reference render", (value, format, type = 'Number') => {
    const t = formatCache[format] || (formatCache[format] = new rose.TextRenderer(format));
    return type === 'Number' ?
      t.formatNumber(value) :
      t.formatDate(value);
  })
  .addFunction("excel-style-dataformatter", (value, format, type = 'Number') => {
    xlf.format(value, type, format);
  })

  .addInput('Integer mask', [2398472398, '00-00-00\\.00.00\\/000\\/000'])
  .addInput('Decimal digits', [Math.PI, '0000.0000000000'])
  // .addInput('Fractions', [Math.PI, '# #/###'])
  .addInput('Thousand separators', [12345678903, '0,0'])
  .addInput('Scientific notation', [12345678903, '000E+0'])
  .addInput('Percentage', [12345678903, '0%%%'])
  // .addInput('yyyy-mm-dd', [new Date(), 'yyyy-mm-dd', 'DateTime'])
  // .addInput('hh:mm:ss', [new Date(), 'hh:mm:ss', 'DateTime'])
  // .addInput('[hh]:mm:ss', [new Date(), '[hh]:mm:ss', 'Number'])
  .on('cycle', event => {
    console.log(event.target.toString())
  })
  .on('complete', () => {
    console.log(numbersSuite.table.toString());
    console.log('Fastest is ' + numbersSuite.filter('fastest').map('name'));
    console.log(benchTableHTML(numbersSuite.table))
    console.log(benchTableBarPlot(numbersSuite))
  })
  .run({ async: false })

function benchTableHTML(table) {
  html = ['<table>\n  <tr>']
  html.push(table.options.head.map(s => `\n    <th>${s}</th>`).join('') + '\n  </tr>')
  for (let i = 0; i < table.length; ++i) {
    for (const k in table[i]) {
      if (Object.hasOwnProperty.call(table[i], k)) {
        html.push('\n  <tr>' + table[i][k].map(c => `\n    <td>${c}</td>`).join('') + '\n  </tr>')
      }
    }
  }
  html.push('\n</table>')
  return html.join('')
}

function benchTableBarPlot(suite) {
  const legend = []
  const series = []
  for (const c in suite._results) {
    if (Object.hasOwnProperty.call(suite._results, c)) {
      legend.push(c);
      series.push(suite._results[c].map(b => b.hz / 1000))
    }
  }
  const { d3n, svg } = bar({
    labels: { x: suite._inputNames, yAxis: 'values formatted per millisecond' },
    series, width: 720, height: 360
  });
  svg.append("circle").attr("cx", 50).attr("cy", 30).attr("r", 10).style("fill", d3n.d3.schemeCategory10[0])
  svg.append("circle").attr("cx", 50).attr("cy", 60).attr("r", 10).style("fill", d3n.d3.schemeCategory10[1])
  svg.append("circle").attr("cx", 50).attr("cy", 90).attr("r", 10).style("fill", d3n.d3.schemeCategory10[2])
  svg.append("text").attr("x", 70).attr("y", 30).text(legend[0]).style("font-size", "15px").attr("alignment-baseline", "middle")
  svg.append("text").attr("x", 70).attr("y", 60).text(legend[1]).style("font-size", "15px").attr("alignment-baseline", "middle")
  svg.append("text").attr("x", 70).attr("y", 90).text(legend[2]).style("font-size", "15px").attr("alignment-baseline", "middle")
  fs.writeFileSync('./benchmark-result.svg', d3n.svgString())
}


function ss(n) {

}