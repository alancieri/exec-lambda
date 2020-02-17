const readlineSync = require('readline-sync')
const { downloadFunctions } = require('./lib/lambda-download')
const { setLayers } = require('./lib/layers-set')
const { updateLayerVersionLambda, updateLayerVersion } = require('./lib/layer-update')
const { getRegions } = require('./helpers')

const inputRegion = async () => {
  const regions = await getRegions()
  const region = readlineSync.keyInSelect(regions, '> Select the region', { cancel: 'Exit' })
  return regions[region]
}

const menu = async () => {
  console.clear()
  console.log('> Exec Lambda')
  const region = await inputRegion()
  if (!region) {
    console.log('Region not valid!')
    process.exit()
  }
  console.clear()
  console.log('> Exec Lambda')
  console.log('> Selected region:', region)
  const items = [
    'Set layers for selected function',
    'Update layer to last version for selected function',
    'Update layer to last version to all related functions',
    'Download selected function',
    'Download all functions'
  ]
  let index = readlineSync.keyInSelect(items, '> Select the task', { cancel: 'Exit' })
  switch (parseInt(index)) {
    case 0:
      await setLayers(region)
      break
    case 1:
      await updateLayerVersionLambda(region)
      break
    case 2:
      await updateLayerVersion(region)
      break
    case 3:
      const functionName = readlineSync.question('> Lambda function name: ',
        { limit: (input) => input !== '' })
      await downloadFunctions(region, functionName)
      break
    case 4:
      await downloadFunctions(region)
      break
    default :
      process.exit()
  }
}

module.exports = menu
