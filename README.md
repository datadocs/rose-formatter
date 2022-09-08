
<img src="./static/rose.svg" width=100%>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/@datadocs/formatter.svg)](https://npmtrends.com/@datadocs/formatter)
<!-- BEGIN FROZEN IMAGE https://github.com/datadocs/rose-formatter/actions/workflows/validate.yml/badge.svg as validation.svg -->
  <img src="https://github.com/datadocs/rose-formatter/actions/workflows/validate.yml/badge.svg">
<!-- END FROZEN IMAGE -->
## Setup

``` bash
npm install # downloads dependencies
npm generate # generates parse-format.js from parse-format.pegjs
npm test
```

![](./figures/ex01.png)
![](./figures/ex02.png)
![](./figures/ex03.png)
![](./figures/ex04.png)
![](./figures/ex05.png)
![](./figures/ex06.png)
![](./figures/ex07.png)
![](./figures/ex08.png)
![](./figures/ex09.png)
![](./figures/ex10.png)
![](./figures/ex11.png)

## Tests

### Basic syntax

The basic syntax makes sure that the parser accepts the [examples](http://download.microsoft.com/download/6/A/8/6A818B0B-06F4-4E41-80DE-D383A3B89865/TEXT%20function%20examples.xlsx) given in the [Excel text function documentation](https://support.microsoft.com/en-us/office/text-function-20d5ac4d-7b94-49fd-bb38-93d29371225c).


### Format parsing

The format string is parsed using [peggyjs](https://peggyjs.org/), the parser produces a serializable JS object that can then be processed by a renderer alongside with the data.

Once the render is constructed one can invoke renderization methods without processing the format again. So in an application where there is much cells to be rendered than distinct formats, renderers can be cached and looked up when a a new data entry must be formatted.

### Text rendering

To illustrate the renderer a TextRenderer was implemented.


```javascript
const {TextRenderer} = require('@datadocs/formatter')

const r1 = new TextRenderer('# #/###')
console.log(r1.formatNumber(Math.PI))
```

```text
'3 16/113'
```

A renderer could produce any type of output, e.g. an image, a HTML formatted text, or render it on a canvas.

Many more usage examples can be found in `./test/*.spec.js`.
