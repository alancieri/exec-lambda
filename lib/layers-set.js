const util = require('util')
const exec = util.promisify(require('child_process').exec)
const readlineSync = require('readline-sync')

const getLayers = async (selectedLayers) => {
  const { stdout, stderr } = await exec('aws lambda list-layers')
  if (stdout) {
    let arns = []
    for (let { LayerName, LatestMatchingVersion: { LayerVersionArn } } of JSON.parse(stdout).Layers) {
      if (selectedLayers.includes(LayerName)) { arns.push(LayerVersionArn) }
    }
    console.log('Related Arns', arns)
    return arns.join(' ')
  }
  if (stderr) {
    console.log('\nErrors:\n', stderr)
  }
}

const setLayers = async () => {
  const functionName = readlineSync.question('> Lambda function name: ')
  const layers = readlineSync.question('> Layers to include [layers1, layers2, ...]: ')
  const separator = layers.includes(',') ? ',' : ' '
  const layersArray = layers.split(separator).map((item) => item.trim())
  const strArns = await getLayers(layersArray)
  const { stdout, stderr } = await exec(`aws lambda update-function-configuration --function-name ${functionName} --layers ${strArns}`)
  if (stderr) {
    console.log('Error', stderr)
    return false
  }
  console.log('Result', stdout)
}

module.exports = { setLayers }
