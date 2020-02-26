const util = require('util')
const exec = util.promisify(require('child_process').exec)
const readlineSync = require('readline-sync')
const { selectFunction } = require('./../helpers')

const getLayers = async (region, selectedLayers) => {
  const { stdout, stderr } = await exec(`aws lambda list-layers --region ${region}`)
  if (stdout) {
    let arns = []
    for (let { LayerName, LatestMatchingVersion: { LayerVersionArn } } of JSON.parse(stdout).Layers) {
      if (selectedLayers.includes(LayerName)) { arns.push(LayerVersionArn) }
    }
    if (arns.length === 0) {
      console.log('> No layer found!'.red)
      process.exit()
    }
    console.log('> Selected Layers:\n'.yellow, arns)
    return arns.join(' ')
  }
}

const inputOpt = { limit: (input) => input !== '' }

const setLayers = async (region) => {
  let functionName = readlineSync.question('> Lambda function name [ENTER for list]: '.yellow)
  if (functionName.trim() === '') {
    functionName = await selectFunction(region)
  }
  const layers = readlineSync.question('> Layers to include [layers1, layers2, ... [none]]: '.yellow, inputOpt)
  let strArns = ''
  if (layers !== 'none') {
    const separator = layers.includes(',') ? ',' : ' '
    const layersArray = layers.split(separator).map((item) => item.trim())
    strArns = await getLayers(region, layersArray)
  }
  if (!readlineSync.keyInYN(`Update function ${functionName}?`.blue)) { return false }
  try {
    const { stdout, stderr } = await exec(`aws lambda update-function-configuration --region ${region} --function-name ${functionName} --layers ${strArns}`)
    console.log(JSON.parse(stdout))
  } catch (e) {
    console.log(`${e.message}`.red)
    process.exit()
  }
}

module.exports = { setLayers }
