const fs = require('fs');
const https = require('https');
const readme_file = __dirname + '/../README.md'
let README = fs.readFileSync(readme_file, {encoding:'utf-8'})
const FROZEN_SECTION = /\<\!--\s*BEGIN\s*FROZEN\s*IMAGE\s*(https:\/\/\S*?)(?:\s*as\s*(\S*?))?\s*-->.*?\<!--\s*END\s*FROZEN\s*IMAGE\s*--\>/igs
const FROZEN_RE = /\!\[]\((static\/frozen-[^)]*)\)/g

const pending_downloads = []
README = README.replace(FROZEN_SECTION, downloadAndUpdate);
Promise.all(pending_downloads).then(
  r => {
    README = README.replace(FROZEN_RE, embedFrozenImage)
  }
).then(r => {
  fs.writeFileSync(readme_file, README)
})
function downloadAndUpdate(body, url, alias){
  if(!alias){
    alias = url.split('?')[0].split('/').pop()
  }
  
  pending_downloads.push(new Promise((resolve, reject) => {
    const tid = setTimeout(() => reject(new Error('Timeout')), 15000)
    https.get(url, 
    {
      "headers": {
        "cache-control": "no-cache",
        "pragma": "no-cache"
      },
    },
    (response, error) => {
      if(error){
        console.log(`Failed to download ${url}`)
        clearTimeout(tid)
        reject(new Error(`Failed to download ${url}`))
      }else{
        const file = fs.createWriteStream(`${__dirname}/../static/frozen-${alias}`);
        file.on('finish', () => {
          console.log(`Saved file ${alias}`)
          clearTimeout(tid)
          resolve();
        })
        response.pipe(file);
      }
    })
 }))
 return `<!-- BEGIN FROZEN IMAGE ${url} as ${alias} -->
  ![](static/frozen-${alias})
<!-- END FROZEN IMAGE -->`
}

function embedFrozenImage(_, img){
  const data = (Buffer.from(fs.readFileSync(`${__dirname}/../${img}`, {encoding:'utf-8'}))).toString('base64');
  const extension = img.toLowerCase().split('.').pop()
  switch(extension){
    case 'svg': return `<img src="data:image/svg+xml;base64,${data}">`;
    case 'png': return `<img src="data:image/png;base64, ${data}">`;
    default:
      return _;
  }
}
