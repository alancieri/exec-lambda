const util = require('util')
const exec = util.promisify(require('child_process').exec)

const getFunctionList = async (region) => {
  try {
    const { stdout, stderr } = await exec(`aws lambda list-functions --region ${region}`)
    return stdout
  } catch (e) {
    console.log(e.message)
    process.exit()
  }
}

const getFunction = async (region, name) => {
  try {
    const { stdout } = await exec(`aws lambda get-function --function-name ${name} --region ${region}`)
    return stdout
  } catch (e) {
    console.log(e.message)
    process.exit()
  }
}

const getLastLayerVersion = async (region, layerName) => {
  try {
    const { stdout, stderr } = await exec(`aws lambda list-layer-versions --layer-name ${layerName} --region ${region} --no-paginate`)
    const { LayerVersions } = JSON.parse(stdout)
    if (LayerVersions.length === 0) {
      console.log('Layer not found!')
      process.exit()
    }
    return LayerVersions[0].LayerVersionArn
  } catch (e) {
    console.log(e.message)
    process.exit()
  }
}

const getRegions = async () => {
  console.log('Waiting available regions...')
  try {
    let regions = []
    const { stdout } = await exec(`aws lightsail get-regions`)
    const items = JSON.parse(stdout).regions
    for (let item of items) {
      regions.push(item.name)
    }
    return regions
  } catch (e) {
    console.log(e.message)
    process.exit()
  }
}

module.exports = { getFunction, getFunctionList, getLastLayerVersion, getRegions }
