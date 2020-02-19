const util = require('util')
const exec = util.promisify(require('child_process').exec)
const readlineSync = require('readline-sync')
const { getFunction, getFunctionList, getFunctionListName, getLastLayerVersion } = require('./../helpers')

const inputFunction = async (region) => {
  const lambdas = await getFunctionListName(region)
  const lambda = readlineSync.keyInSelect(lambdas, '> Select the function', { cancel: 'Exit' })
  if (lambda === -1) { process.exit() }
  return lambdas[lambda]
}

const inputOpt = { limit: (input) => input !== '' }

const updateLayerVersionLambda = async (region) => {
  let functionName = readlineSync.question('> Lambda function name [ENTER for list]: ')
  if (functionName.trim() === '') {
    functionName = await inputFunction(region)
  }
  const layerName = readlineSync.question('> Layer name: ', inputOpt)
  const functionGet = await getFunction(region, functionName)
  const functionList = [functionGet.Configuration]
  return update(region, layerName, functionList)
}

const updateLayerVersion = async (region) => {
  const layerName = readlineSync.question('> Layer name: ', inputOpt)
  const functionList = await getFunctionList(region)
  return update(region, layerName, functionList)
}

const update = async (region, layerName, functionList) => {
  const lastLayerArn = await getLastLayerVersion(region, layerName)
  for (let lambda of functionList) {
    let update = false
    if (lambda.Layers === undefined) { continue }
    let layers = lambda.Layers
    // console.log('lambda', lambda)
    let newArnlist = []
    for (let { Arn } of layers) {
      const layer = Arn.split(':')
      if (layer[6] === layerName) {
        // Update layers of lambda function
        newArnlist.push(lastLayerArn)
        update = true
      }
      else newArnlist.push(Arn)
    }
    if (update) {
      const strArns = newArnlist.join(' ')
      console.log(`Updating lambda ${lambda.FunctionName}...`)
      const { stdout, stderr } = await exec(`aws lambda update-function-configuration --function-name ${lambda.FunctionName} --layers ${strArns}`)
      if (stderr) {
        console.log('Error', stderr)
        return false
      }
      console.log(JSON.parse(stdout).Layers)
    }
  }
}

module.exports = { updateLayerVersionLambda, updateLayerVersion }
