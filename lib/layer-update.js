const util = require('util')
const exec = util.promisify(require('child_process').exec)
const readlineSync = require('readline-sync')
const { getFunction, getFunctionList, getLastLayerVersion, selectFunction } = require('./../helpers')

const inputOpt = { limit: (input) => input !== '' }

const updateLayerVersionLambda = async (region) => {
  let functionName = readlineSync.question('> Lambda function name [ENTER for list]: '.yellow)
  if (functionName.trim() === '') {
    functionName = await selectFunction(region)
  }
  const layerName = readlineSync.question('> Layer name: ', inputOpt)
  const functionGet = await getFunction(region, functionName)
  const functionList = [functionGet.Configuration]
  return update(region, layerName, functionList)
}

const updateLayerVersion = async (region) => {
  const versionTagging = readlineSync.keyInYN('Enable tagging?') ? true : false
  const layerName = readlineSync.question('> Layer name: ', inputOpt)
  const functionList = await getFunctionList(region)
  return update(region, layerName, functionList, versionTagging)
}

const tagVersion = async ( fnName, region ) => {
  let nv = readlineSync.keyInYN('Do you want to publish new version?')
  if (nv) {
    let version
    try {
      const { stdout, stderr } = await exec(`aws lambda publish-version --function-name ${fnName} --region ${region}`)
      version = JSON.parse(stdout)
    } catch (e) {
      console.log(e.message)
      return false
    }
    let mv = readlineSync.keyInYN('Do you want to match this version with an alias?')
    if (mv && version.Version) {
      const { stdout, stderr } = await exec(`aws lambda list-aliases --region ${region} --function-name ${fnName} `);
      const rawAliases = JSON.parse(stdout);
      let aliases = [];
      rawAliases.Aliases.forEach(elem => aliases.push(elem.Name));
      let index = readlineSync.keyInSelect(aliases, '> Select alias'.yellow, { cancel: 'Exit' })
      await exec(`aws lambda update-alias --function-name ${fnName} --name ${aliases[index]} --function-version ${version.Version} --region ${region}`)
      console.log(`Alias [${aliases[index]}] is set to version [${version.Version}] ...\n\n`.green)
    }
  }
  return true
}

const update = async (region, layerName, functionList, versionTagging) => {
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
      console.log(`Updating lambda ${lambda.FunctionName}...`.green)
      try {
        const { stdout, stderr } = await exec(`aws lambda update-function-configuration --region ${region} --function-name ${lambda.FunctionName} --layers ${strArns}`)
        console.log(JSON.parse(stdout).Layers)
        if (versionTagging) await tagVersion( lambda.FunctionName, region )
      } catch (e) {
        console.log(e.message)
        process.exit()
      }
    }
  }
}

module.exports = { updateLayerVersionLambda, updateLayerVersion }
