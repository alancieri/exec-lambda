const util = require('util')
const exec = util.promisify(require('child_process').exec)
const readlineSync = require('readline-sync')
const { getFunctionListName } = require('./../helpers')

const inputFunction = async (region) => {
  const lambdas = await getFunctionListName(region)
  const lambda = readlineSync.keyInSelect(lambdas, '> Select the function', { cancel: 'Exit' })
  if (lambda === -1) { process.exit() }
  return lambdas[lambda]
}

const getLayers = async (region, selectedLayers) => {
  const { stdout, stderr } = await exec(`aws lambda list-layers --region ${region}`)
  if (stdout) {
    let arns = []
    for (let { LayerName, LatestMatchingVersion: { LayerVersionArn } } of JSON.parse(stdout).Layers) {
      if (selectedLayers.includes(LayerName)) { arns.push(LayerVersionArn) }
    }
    if (arns.length === 0) {
      console.log('> No layer found!')
      process.exit()
    }
    console.log('> Selected Layers:\n', arns)
    return arns.join(' ')
  }
  if (stderr) {
    console.log('\nErrors:\n', stderr)
  }
}

const inputOpt = { limit: (input) => input !== '' }

const setLayers = async (region) => {
  let functionName = readlineSync.question('> Lambda function name [ENTER for list]: ')
  if (functionName.trim() === '') {
    functionName = await inputFunction(region)
  }
  const layers = readlineSync.question('> Layers to include [layers1, layers2, ... [none]]: ', inputOpt)
  let strArns = ''
  if (layers !== 'none') {
    const separator = layers.includes(',') ? ',' : ' '
    const layersArray = layers.split(separator).map((item) => item.trim())
    strArns = await getLayers(region, layersArray)
  }
  if (!readlineSync.keyInYN(`Update function ${functionName}?`)) { return false }
  try {
    const { stdout, stderr } = await exec(`aws lambda update-function-configuration --function-name ${functionName} --layers ${strArns}`)
    console.log(JSON.parse(stdout))
  } catch (e) {
    console.log(e.message)
    process.exit()
  }

}

module.exports = { setLayers }
