const lambdaDownload = require('download-file')
const extract = require('extract-zip')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const readlineSync = require('readline-sync')
const fs = require('fs')
const { getFunction, getFunctionList } = require('./../helpers')

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

const getFunctionLocation = async (region, FunctionName) => {
  try {
    const { Code: { Location: location } } = JSON.parse(await getFunction(region, FunctionName))
    return location
  } catch (e) {
    console.log(e.message)
    process.exit()
  }
}

const downloadPath = '~/Downloads/lambda-functions'

const downloadFunctions = async (region, functionName = null) => {
  if (!readlineSync.keyInYN(`Do you confirm the download?`)) { return false }
  try {
    console.log('Starting...')
    if (!fs.existsSync(downloadPath)) { await exec(`mkdir ${downloadPath} && chmod -R 777 ${downloadPath}`) }
    let functionList = !functionName ? JSON.parse(await getFunctionList(region)).Functions : [{ FunctionName: functionName }]
    functionList.map(async ({ FunctionName }) => {
      await downloadFile(downloadPath, `${FunctionName}.zip`, await getFunctionLocation(region, FunctionName))
      console.log(`${downloadPath}/${FunctionName}.zip`)
    })
  } catch (e) {
    console.log('error', e)
  }
}

module.exports = { downloadFunctions }



