const canvas = require('canvas');
const gif = require('gif-encoder-2')
const fs = require('fs')
const f = require('../dist/index')
const UPNG = require('upng-js');
class DemoGIF{
  constructor(width, height, delay){
    this.canvas = canvas.createCanvas(width, height);
    this.ctx = this.canvas.getContext('2d')
    this.ctx.font = '12px Arial'
    const encoder = new gif(width, height, 'octree', true);
    encoder.setDelay(delay);
    this.delay = delay;
    encoder.start(); // starts the encoder
    this.encoder = encoder;
    this.bgColor = '#1C1D1E';
    this.headingColor = '#3C4EC0';
    this.contentColor = '#CE9178';
    this.fontSize=14
    this.frames = []
    this.delays = []
  }
  drawText(loc, txt){
    const extent = this.ctx.measureText(txt);
    if(typeof extent.height === 'undefined'){
      extent.height = extent.emHeightAscent + extent.emHeightDescent
    }
    if(typeof loc.bottom === 'undefined'){
      loc.bottom = loc.top + extent.height;
    }
    if(typeof loc.left === 'undefined'){
      loc.left = loc.right - extent.width;
    }
    loc.top = loc.bottom - extent.height;
    loc.right = loc.left + extent.width;

    this.ctx.fillText(txt, loc.left, loc.bottom, loc.maxWidth);
    loc.height = extent.height;
    loc.width = extent.width;
    return loc;
  }

  addFrame(input, format, result, repeats){
    this.ctx.fillStyle = this.bgColor;  
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const vline = 80;
    let top = 5
    for(const [k,v] of [['input: ', input], ['format: ', format], ['result: ', result]]){
      this.ctx.font = `bold ${this.fontSize}px Arial`;
      this.ctx.fillStyle = this.headingColor;
      const u1 = this.drawText({right:vline, top, maxWidth: vline}, k)
      this.ctx.font = `${this.fontSize}px Arial`;
      this.ctx.fillStyle = this.contentColor;
      const u2 = this.drawText({left:vline, top, maxWidth: this.canvas.width - vline}, v)
      top += Math.max(u1.height, u2.height)*1.25;
    }
    // this.ctx.measureText('input:');
    // this.ctx.fillText( `\n  input: ${input}\n format: ${format}\n result: ${result}`, 0, 0);
    // this.ctx.fillStyle = '#ff4040'
    // this.ctx.fillText( `\n  input:\n format:\n result:`, 0, 0);
    this.encoder.addFrame(this.ctx);
    this.frames.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height))
    this.delays.push(this.delay * (repeats || 1))
  }
  async save(fname){
    this.encoder.finish();
    const gifBuffer = this.encoder.out.getData();
    const frames = this.frames.map(d => d.data)
    const pngBuffer = UPNG.encode(frames, this.canvas.width, this.canvas.height, 5, this.delays);
    if(fname.endsWith('.gif')){
      fname = fname.slice(0,-4);
    }
    console.log(`${fname}.gif ${(gifBuffer.byteLength / 1024).toFixed(2)}kB`)
    console.log(`${fname}.png ${(pngBuffer.byteLength / 1024).toFixed(2)}kB`)
    await new Promise((resolve, reject) => {
      fs.writeFile(fname + '.gif', gifBuffer, error => {
        error ? reject(error) : resolve();
      })
    });
    await new Promise((resolve, reject) => {
      fs.writeFile(fname + '.png', Buffer.from(pngBuffer), error => {
        error ? reject(error) : resolve();
      })
    });
  }
}

async function revealFormat(fmt, value, fname, fps=15){
  const scene = new DemoGIF(480, 72, 1000 / fps);
  let ll = 0;
  let result = '';
  let delay = 1;
  const input = value.toString()
  for(let i = 0; i < fmt.length; ++i){
    const fmtv = fmt.substr(0, i+1);
    try{
      const formatter = new f.TextRenderer(fmtv)
      result = formatter.formatNumber(value)
      delay = ll ? Math.max(fmtv.length + result.length - ll, 1) : 1
      ll = result.length + fmtv.length;
    }catch(e){
      // console.log(e)
      continue
    }
    scene.addFrame(input, fmtv, result, delay) 
  }
  await scene.save(fname)
}
async function revealFormat(fmt, value, fname, fps=15){
  const scene = new DemoGIF(480, 72, 1000 / fps);
  let ll = 0;
  let result = '';
  let delay = 1;
  const input = value.toString()
  for(let i = 0; i < fmt.length; ++i){
    const fmtv = fmt.substr(0, i+1);
    try{
      const renderer = new f.TextRenderer(fmtv)
      result = renderer.formatNumber(value)
      delay = ll ? Math.max(fmtv.length + result.length - ll, 1) : 1
      ll = result.length + fmtv.length;
    }catch(e){
      // console.log(e)
      continue
    }
    scene.addFrame(input, fmtv, result, delay) 
  }
  await scene.save(fname)
}

async function revealInput(fmt, value, fname, fps=15){
  const scene = new DemoGIF(480, 72, 1000 / fps);
  let ll = 0;
  let result = '';
  let delay = 1;
  const renderer = new f.TextRenderer(fmt)
  for(let i = 0; i < value.length; ++i){
    const input = value.toString().substr(0, i+1)
    try{
      result = renderer.formatNumber(+input)
      delay = ll ? Math.max(result.length - ll, 1) : 1
      ll = result.length;
    }catch(e){
      console.log(e)
      continue
    }
    scene.addFrame(input, fmt, result, delay) 
  }
  await scene.save(fname)
}


revealFormat('0.0000E+000', 123.45678, 'figures/ex01');
revealFormat('0 0/000000', 100 * Math.PI, 'figures/ex02');
revealFormat('0.0%', 0.234, 'figures/ex03', 5);
revealFormat('###-000\\bb00\\xc000!', 1029384756, 'figures/ex04');
revealFormat('dd of mmmm of yyyy, dddd hh:mm:ss.000', 
  f.jsDateToExcelDate(new Date()), 'figures/ex05');
revealFormat('d "day" = [h]"h" m"m" s"s" = [m]\\m s"s" = [s]"s"', 1, 'figures/ex06');
revealInput('0.###E+0', '12345678987654321', 'figures/ex07', 10)
revealInput('000.###E+0', '12345678987654321', 'figures/ex08', 5)
revealInput('00000.###E+0', '12345678987654321', 'figures/ex09', 5)
revealInput('#####.###E+0', '12345678987654321', 'figures/ex10', 5)
revealInput('#,#.00', '12345678987654.321', 'figures/ex11', 5)
revealInput('[>=1e9]0,,,Bi;[>=1e6]0,,\\M;[>=1e3]0,k;#', '12345678987654', 'figures/ex12', 5)