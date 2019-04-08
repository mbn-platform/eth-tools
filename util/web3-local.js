const fs = require('fs')
const path = require('path')

function getDir() {
  if (process.env.ETHDIR) {
    return path.resolve(process.env.ETHDIR)
  }
  else {
    return path.join(process.env.HOME, '.eth')
  }
}

function getPrivatePath(dir) {
  return path.join(dir, 'private.json')
}

function getAddressPath(dir) {
  return path.join(dir, 'address.pub')
}

function getPrivate(dir) {
  return JSON.parse(
    fs.readFileSync(getPrivatePath(dir), 'utf8')
  )
}

function getAddress(dir) {
  return fs.readFileSync(getAddressPath(dir), 'utf8')
}

function selectNetwork() {
  switch (process.env.NET || '') {
  case 'main':
  case 'mainnet':
    return 'mainnet'
  case 'rinkeby':
  case '':
    return 'rinkeby'
  default:
    throw new Error('Unknown network')
  }
}

function getContractPath(dir, name) {
  return path.join(dir, name + '.json')
}

exports.getDir = getDir
exports.getPrivatePath = getPrivatePath
exports.getAddressPath = getAddressPath
exports.getContractPath = getContractPath
exports.getPrivate = getPrivate
exports.getAddress = getAddress
exports.selectNetwork = selectNetwork
