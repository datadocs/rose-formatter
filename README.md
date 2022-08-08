## Setup

``` bash
npm install # downloads dependencies
npm generate # generates parse-format.js from parse-format.pegjs
npm test
```

## Tests

### Basic syntax

The basic syntax makes sure that the parser accepts the [examples](http://download.microsoft.com/download/6/A/8/6A818B0B-06F4-4E41-80DE-D383A3B89865/TEXT%20function%20examples.xlsx) given in the [Excel text functoin documentation](https://support.microsoft.com/en-us/office/text-function-20d5ac4d-7b94-49fd-bb38-93d29371225c).

### Semantic analysis

**TODO**:Check if the meaning of the tokens in valid formats are correctly understood.

### Text rendering

**TODO** Check if the format is correctly rendered to text.