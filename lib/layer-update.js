const util = require('util')
const exec = util.promisify(require('child_process').exec)
const readlineSync = require('readline-sync')

const getFunctionList = async () => {
  const { stdout, stderr } = await exec('aws lambda list-functions')
  if (stderr) {
    throw new Error(stderr)
  }
  const { Functions } = JSON.parse(stdout)
  return Functions
}

const getFunction = async (functionName) => {
  const { stdout, stderr } = await exec(`aws lambda get-function --function-name ${functionName}`)
  if (stderr) {
    throw new Error(stderr)
  }
  return JSON.parse(stdout).Configuration
}

const getLastLayerVersion = async (layerName) => {
  const { stdout, stderr } = await exec(`aws lambda list-layer-versions --layer-name ${layerName} --no-paginate`)
  if (stderr) { throw new Error(stderr) }
  const { LayerVersions } = JSON.parse(stdout)
  return LayerVersions[0].LayerVersionArn
}

const updateLayerVersionLambda = async () => {
  const layerName = readlineSync.question('> Layer name: ')
  const functionName = readlineSync.question('> Function name: ')
  const lastLayerArn = await getLastLayerVersion(layerName)
  const functionList = [await getFunction(functionName)]
  return update(layerName, functionList)
}

const updateLayerVersion = async () => {
  const layerName = readlineSync.question('> Layer name: ')
  const functionList = await getFunctionList()
  return update(layerName, functionList)
}

const update = async (layerName, functionList) => {
  const lastLayerArn = await getLastLayerVersion(layerName)
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
