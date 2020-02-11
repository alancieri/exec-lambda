const readlineSync = require('readline-sync')
const { downloadFunctions } = require('./lib/lambda-download')
const { setLayers } = require('./lib/layers-set')

const menu = async () => {
  console.log('> Lambda functions exec')
  const items = ['Set layers', 'Download selected function', 'Download all functions']
  let index = readlineSync.keyInSelect(items, '> Select the task', { cancel: 'Exit' })
  switch (parseInt(index)) {
    case 0:
      await setLayers()
      break
    case 1:
      const functionName = readlineSync.question('> Lambda function name: ')
      await downloadFunctions(functionName)
      break
    case 2:
      await downloadFunctions()
      break
    default :
      process.exit()
  }
}

menu()
