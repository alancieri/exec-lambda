const util = require('util')
const exec = util.promisify(require('child_process').exec)
const readlineSync = require('readline-sync')
const colors = require('colors')

const getFunctionList = async (region) => {
    try {
        const { stdout, stderr } = await exec(`aws lambda list-functions --region ${region}`)
        return JSON.parse(stdout).Functions
    } catch (e) {
        console.log(`${e.message}`.red)
        process.exit()
    }
}

const getFunction = async (region, name) => {
    try {
        const { stdout } = await exec(`aws lambda get-function --function-name ${name} --region ${region}`)
        return JSON.parse(stdout)
    } catch (e) {
        console.log(`${e.message}`.red)
        process.exit()
    }
}

const getLastLayerVersion = async (region, layerName) => {
    try {
        const { stdout, stderr } = await exec(`aws lambda list-layer-versions --layer-name ${layerName} --region ${region} --no-paginate`)
        const { LayerVersions } = JSON.parse(stdout)
        if (LayerVersions.length === 0) {
            console.log('Layer not found!'.red)
            process.exit()
        }
        return LayerVersions[0].LayerVersionArn
    } catch (e) {
        console.log(`${e.message}`.red)
        process.exit()
    }
}

const _getRegions = async () => {
    console.log('\nWaiting available regions...'.green)
    try {
        let regions = []
        const { stdout } = await exec(`aws lightsail get-regions`)
        const items = JSON.parse(stdout).regions
        for (let item of items) {
            regions.push(item.name)
        }
        return regions
    } catch (e) {
        console.log(`${e.message}`.red)
        process.exit()
    }
}

const selectRegion = async () => {
    const regions = await _getRegions()
    const region = readlineSync.keyInSelect(regions, '> Select the region'.yellow, { cancel: 'Exit' })
    return regions[region]
}

const _paginateListFunction = async (region, token = null) => {
    if (!token) { console.log('\nWaiting available functions...'.green) }
    const strToken = token ? `--starting-token ${token}` : ``
    try {
        let functionsList = []
        const { stdout } = await exec(`aws lambda list-functions --max-items 20 ${strToken} --region ${region}`)
        const response = JSON.parse(stdout)
        const items = response.Functions
        const nextToken = response.NextToken ? response.NextToken : null
        for (let item of items) {
            functionsList.push(item.FunctionName)
        }
        functionsList.sort()
        // console.log('response', { functionsList, nextToken })
        return { functionsList, nextToken }
    } catch (e) {
        console.log(`${e.message}`.red)
        process.exit()
    }
}

const selectFunction = async (region, token = null) => {
    const res = await _paginateListFunction(region, token)
    const option = res.nextToken ? { cancel: 'Show more...' } : { cancel: 'Exit' }
    const functionName = readlineSync.keyInSelect(res.functionsList, '> Select the function'.yellow, option)
    if (functionName === -1) {
        if (res.nextToken) {
            return selectFunction(region, res.nextToken)
        }
        else process.exit()
    }
    return res.functionsList[functionName]
}

module.exports = {
    getFunction,
    getFunctionList,
    selectFunction,
    getLastLayerVersion,
    selectRegion
}
