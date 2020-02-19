const util = require('util')
const exec = util.promisify(require('child_process').exec)
const readlineSync = require('readline-sync')

const getFunctionList = async (region) => {
  try {
    const { stdout, stderr } = await exec(`aws lambda list-functions --region ${region}`)
    return JSON.parse(stdout).Functions
  } catch (e) {
    console.log(e.message)
    process.exit()
  }
}

const getFunction = async (region, name) => {
  try {
    const { stdout } = await exec(`aws lambda get-function --function-name ${name} --region ${region}`)
    return JSON.parse(stdout)
  } catch (e) {
    console.log(e.message)
    process.exit()
  }
}

const getLastLayerVersion = async (region, layerName) => {
  try {
    const { stdout, stderr } = await exec(`aws lambda list-layer-versions --layer-name ${layerName} --region ${region} --no-paginate`)
    const { LayerVersions } = JSON.parse(stdout)
    if (LayerVersions.length === 0) {
      console.log('Layer not found!')
      process.exit()
    }
    return LayerVersions[0].LayerVersionArn
  } catch (e) {
    console.log(e.message)
    process.exit()
  }
}

const _getRegions = async () => {
  console.log('Waiting available regions...')
  try {
    let regions = []
    const { stdout } = await exec(`aws lightsail get-regions`)
    const items = JSON.parse(stdout).regions
    for (let item of items) {
      regions.push(item.name)
    }
    return regions
  } catch (e) {
    console.log(e.message)
    process.exit()
  }
}

const selectRegion = async () => {
  const regions = await _getRegions()
  const region = readlineSync.keyInSelect(regions, '> Select the region', { cancel: 'Exit' })
  return regions[region]
}

const _paginateListFunction = async (region, token = null) => {
  if (!token) { console.log('\nWaiting available functions...') }
  const strToken = token ? `--starting-token ${token}` : ``
  try {
    let functionsList = []
    const { stdout } = await exec(`aws lambda list-functions --max-items 20 ${strToken} --region ${region}`)
    const response = JSON.parse(stdout)
    const items = response.Functions
    const nextToken = response.NextToken ? response.NextToken : null
    for (let item of items) {
      functionsList.push(item.FunctionName)
    }
    functionsList.sort()
    // console.log('response', { functionsList, nextToken })
    return { functionsList, nextToken }
  } catch (e) {
    console.log(e.message)
    process.exit()
  }
}

const selectFunction = async (region, token = null) => {
  const res = await _paginateListFunction(region, token)
  const option = res.nextToken ? { cancel: 'Show more...' } : { cancel: 'Exit' }
  const functionName = readlineSync.keyInSelect(res.functionsList, '> Select the function', option)
  if (functionName === -1) {
    if (res.nextToken) {
      return selectFunction(region, res.nextToken)
    }
    else process.exit()
  }
  return res.functionsList[functionName]
}

module.exports = {
  getFunction,
  getFunctionList,
  selectFunction,
  getLastLayerVersion,
  selectRegion
}
