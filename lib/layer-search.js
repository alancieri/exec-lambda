const util = require('util')
const exec = util.promisify(require('child_process').exec)
const readlineSync = require('readline-sync')
const { getFunctionList } = require('./../helpers')

const inputOpt = { limit: (input) => input !== '' }

const searchLayer = async (region) => {
    const layerName = readlineSync.question('> Layer name: ', inputOpt)
    const functionList = await getFunctionList(region)
    
    for (let lambda of functionList) {
        let found = false
        if (!lambda['Layers']) continue
        let layers = lambda['Layers']
        for (let { Arn } of layers) {
            const layer = Arn.split(':')
            if (layer[6] === layerName)
                found = true
        }
        if (found) {
            console.log(`${lambda.FunctionName}`.green)
            try {
                const { stdout } = await exec(`aws lambda get-function-configuration --region ${region} --function-name ${lambda.FunctionName}`)
                layers = JSON.parse(stdout)['Layers']
                for (let { Arn } of layers) {
                    if (Arn.indexOf(layerName) > -1)
                        console.log(Arn.blue)
                }
                
            } catch (e) {
                console.log(e.message)
                process.exit()
            }
        }
    }
}

module.exports = { searchLayer }
