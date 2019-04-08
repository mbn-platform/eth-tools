const createContract = require('./web3-contract')

// Deploy contract
async function deployContract(web3, contract, args = [], {from, ...options}) {
  let {gasLimit} = options

  if (! gasLimit) {
    const block = await web3.eth.getBlock('latest')
    gasLimit = block.gasLimit
  }

  const Contract = new web3.eth.Contract(contract.abi, {
    gas: gasLimit,
    ...options,
    from,
  })

  return Contract.deploy({
    data: '0x' + contract.evm.bytecode.object,
    arguments: args,
  })
  .send({
    from,
    ...options,
  })
}

// Associate accounts with passed names
async function getAccounts(web3, names, defaultName = 'other') {
  const all = await web3.eth.getAccounts()

  return all.reduce((result, address, i) => ({
    ...result,
    [names[i] || defaultName + i]: all[i],
  }), {})
}

function createDeployment(web3, contract) {
  const {evm} = contract
  if (!evm || ! evm.bytecode || ! evm.bytecode.object || ! evm.bytecode.object.length) {
    throw new Error('Invalid contract descriptor')
  }

  let deploy

  if (contract.evm) {
    deploy = function (...callArgs) {
      return {
        send(...args) {
          let opts
          if (typeof args[0] === 'string') {
            opts = {from: args[0]}
          }
          else {
            opts = args[0]
          }

          return deployContract(web3, contract, callArgs, opts)
        },
      }
    }
  }

  const at = function(address) {
    return createContract(web3, contract.abi, address)
  }

  return {
    deploy,
    at,
  }
}

async function createDeployments(web3, contracts) {
  return Object.getOwnPropertyNames(contracts)
  .reduce((result, name) => ({
    ...result,
    [name]: createDeployment(web3, contracts[name]),
  }), {})
}

exports.deployContract = deployContract
exports.getAccounts = getAccounts
exports.createDeployments = createDeployments
exports.createDeployment = createDeployment
