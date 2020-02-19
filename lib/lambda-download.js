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
    const resultFunction = await getFunction(region, FunctionName)
    // console.log('resultFunction', resultFunction)
    const { Code: { Location: location } } = resultFunction
    return location
  } catch (e) {
    console.log(`${e.message}`.red)
    process.exit()
  }
}

const checkDownloadPath = async (region) => {
  const downloadPath = '~/Downloads/lambda-functions/' + region
  const { stdout } = await exec(`echo ${downloadPath}`)
  const absPath = stdout.trim()
  // console.log('absPath', '*' + absPath + '*')
  try {
    await exec(`mkdir ${absPath} && chmod -R 777 ${absPath}`)
    return absPath
  } catch (e) {
    return absPath
  }
}

const downloadFunctions = async (region, functionName = null) => {
  if (!readlineSync.keyInYN(`\n> Do you confirm the download?`.blue)) { return false }
  try {
    console.log('\nStarting...\n'.green)
    const absPath = await checkDownloadPath(region)
    let functionList = !functionName ? await getFunctionList(region) : [{ FunctionName: functionName }]
    functionList.map(async ({ FunctionName }) => {
      await downloadFile(absPath, `${FunctionName}.zip`, await getFunctionLocation(region, FunctionName))
      console.log(`> ${absPath}/${FunctionName}.zip`.blue)
    })
  } catch (e) {
    console.log(`${e.message}`.red)
  }
}

module.exports = { downloadFunctions }



