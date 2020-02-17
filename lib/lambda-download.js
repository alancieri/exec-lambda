const lambdaDownload = require('download-file')
const extract = require('extract-zip')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const readlineSync = require('readline-sync')
const fs = require('fs')

const downloadFile = async (dir, filename, url) => {
  let options = { directory: dir, filename: filename }
  try {
    await lambdaDownload(url, options)
    return true
  } catch (e) {
    throw new Error(e)
  }
}

const extractZip = async (source, target) => {
  try {
    await extract(source, { dir: target })
    return true
  } catch (e) {
    throw new Error(e)
  }
}

const getFunctionList = async () => {
  const { stdout, stderr } = await exec('aws lambda list-functions')
  if (stderr) {
    throw new Error(stderr)
  }
  return stdout
}

const getFunction = async (name) => {
  const { stdout, stderr } = await exec(`aws lambda get-function --function-name ${name}`)
  if (stderr) { throw new Error(stderr) }
  return stdout
}

const getFunctionLocation = async (FunctionName) => {
  const { Code: { Location: location } } = JSON.parse(await getFunction(FunctionName))
  return location
}

const downloadFunctions = async (functionName = null) => {
  if (!readlineSync.keyInYN(`Do you confirm the download?`)) { return false }
  try {
    console.log('Starting...')
    if (!fs.existsSync('./functions')) { await exec('mkdir lambda-functions && chmod -R 777 functions') }
    let functionList = !functionName ? JSON.parse(await getFunctionList()).Functions : [{ FunctionName: functionName }]
    functionList.map(async ({ FunctionName }) => {
      await downloadFile('./functions', `${FunctionName}.zip`, await getFunctionLocation(FunctionName))
      console.log(FunctionName, 'done')
    })

  } catch (e) {
    console.log('error', e)
  }
}

module.exports = { downloadFunctions }



