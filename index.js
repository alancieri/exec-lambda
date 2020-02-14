const readlineSync = require('readline-sync')
const { downloadFunctions } = require('./lib/lambda-download')
const { setLayers } = require('./lib/layers-set')
const { updateLayerVersionLambda, updateLayerVersion } = require('./lib/layer-update')

const menu = async () => {
  console.log('> Lambda functions exec')
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
      await setLayers()
      break
    case 1:
      await updateLayerVersionLambda()
      break
    case 2:
      await updateLayerVersion()
      break
    case 3:
      const functionName = readlineSync.question('> Lambda function name: ')
      await downloadFunctions(functionName)
      break
    case 4:
      await downloadFunctions()
      break
    default :
      process.exit()
  }
}

menu()
