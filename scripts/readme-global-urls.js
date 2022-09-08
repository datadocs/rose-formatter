
const fs = require('fs');
const https = require('https');
const readme_file = './README.md'
const MD_IMG = /\(\s*(\.\/[^)]*?\.(?:apng|png|svg|jpg|gif))\s*\)/ig
const HTML_IMG = /="(\.\/[^"]*\.(?:apng|png|svg|jpg|gif))\s*"/ig
const refTag = process.env.GITHUB_REF.split('/').pop().trim()
const README = fs.readFileSync(readme_file, {encoding:'utf-8'})
const package = require('../package.json')
const removedFile = {}
const REMOVED = {}
const UPDATED_README = README.replace(MD_IMG, rewriteURL).replace(HTML_IMG, rewriteURL)
fs.writeFileSync(readme_file, UPDATED_README)
console.log(UPDATED_README)

function rewriteURL(orig, file){
  if(removedFile[file] === REMOVED || fs.statSync(file).isFile){
    fs.unlinkSync(file);
    removedFile[file] = REMOVED;
    return orig.replace(file, 
      `${package.repository.url.replace('github.com', 'raw.githubusercontent.com')}${refTag}/${file.slice(2)}`)
  }else{
    return orig;
  }
}