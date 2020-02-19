const readlineSync = require('readline-sync')
const { downloadFunctions } = require('./lib/lambda-download')
const { setLayers } = require('./lib/layers-set')
const { updateLayerVersionLambda, updateLayerVersion } = require('./lib/layer-update')
const { selectFunction, selectRegion } = require('./helpers')

const inputFunction = async (region) => {
  const lambdas = await getFunctionListName(region)
  const lambda = readlineSync.keyInSelect(lambdas, '> Select the function', { cancel: 'Exit' })
  if (lambda === -1) { process.exit() }
  return lambdas[lambda]
}

const menu = async () => {
  console.clear()
  console.log('> Exec Lambda'.cyan)
  const region = await selectRegion()
  if (!region) { process.exit() }
  console.clear()
  console.log('> Exec Lambda'.cyan)
  console.log(`\n> Selected region: ${region}`.green)
  const items = [
    'Set layers for selected function',
    'Update layer to last version for selected function',
    'Update layer to last version to all related functions',
    'Download selected function',
    'Download all functions'
  ]
  let index = readlineSync.keyInSelect(items, '> Select the task'.yellow, { cancel: 'Exit' })
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
      let functionName = readlineSync.question('> Lambda function name [ENTER for list]: '.yellow)
      if (functionName.trim() === '') {
        functionName = await selectFunction(region)
      }
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
