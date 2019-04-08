const Web3 = require('web3')

function createWeb3(config, {network}) {
  return new Web3(config.networks[network])
}

module.exports = createWeb3
