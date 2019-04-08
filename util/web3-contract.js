function createContract(web3, abi, address) {
  const contract = new web3.eth.Contract(abi, address)

  const methods = {}

  abi.forEach((descriptor) => {
    if (descriptor.type !== 'function') {
      return
    }

    const {name} = descriptor

    if (descriptor.constant === false) {
      methods[name] = function(...args) {
        return {
          encodeABI() {
            return contract.methods[name](...args).encodeABI()
          },
          estimateGas() {
            return contract.methods[name](...args).estimateGas()
          },
          send(...ar) {
            let options, privateKey

            if (ar.length > 1) {
              options = ar[0]
              privateKey = ar[1]
            }
            else {
              options = {}
              privateKey = ar[0]
            }

            return sendMethod(web3, {
              contract,
              method: name,
              args,
              options,
              privateKey,
            })
          },
        }
      }
    }
    else {
      methods[name] = function(...args) {
        return {
          encodeABI() {
            return contract.methods[name](...args).encodeABI()
          },
          estimateGas() {
            return contract.methods[name](...args).estimateGas()
          },
          call(options) {
            return contract.methods[name](...args)
            .call(options)
          },
        }
      }
    }
  })

  return {
    base: contract,
    get options() {
      return contract.options
    },
    methods,
  }
}

function sendMethod(web3, {contract, method, args, options, privateKey}) {
  if (! privateKey) {
    return Promise.reject(
      new Error('Private key not set')
    )
  }

  const account = web3.eth.accounts.privateKeyToAccount(
    normalizePrivateKey(privateKey)
  )

  const data = contract.methods[method](...args).encodeABI()

  return contract.methods[method](...args).estimateGas()
  .then((gas) => {
    return web3.eth.accounts.signTransaction({
      to: contract.options.address,
      ...options,
      gas,
      data,
    }, account.privateKey)
    .then(({rawTransaction}) => web3.eth.sendSignedTransaction(rawTransaction))
  })
}

function normalizePrivateKey(privateKey) {
  if (! privateKey.startsWith('0x')) {
    return `0x${privateKey}`
  }
  else {
    return privateKey
  }
}

module.exports = createContract
