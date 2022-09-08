// Ensure consistency between github tag and package version

const package = require('../package.json')
if(process.env.GITHUB_REF.endsWith(package.version)){
  process.exit(0);
}else{
  console.log(`Release tag "${process.env.GITHUB_REF}" is inconsistent with package version "${package.version}"`)
  process.exit(1)
}