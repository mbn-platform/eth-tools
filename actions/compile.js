const fs = require('fs')
const path = require('path')
const solc = require('solc')
const {inspect} = require('util')
const jsStringify = require('javascript-stringify').stringify

const globby = require('globby')
const chalk = require('chalk')

const ch = new chalk.constructor({
  enabled: true,
  level: 1,
})

const defaultSettings = {
  optimizer: {
    // disabled by default
    enabled: false,
    // Optimize for how many times you intend to run the code.
    // Lower values will optimize more for initial deployment cost, higher values will optimize more for high-frequency usage.
    runs: 200,
  },
  outputSelection: {
    '*': {
      '*': [
        'abi',
        'devdoc',
        'userdoc',
        'evm.libraries',
        'evm.bytecode',
        // 'evm.bytecode.object',
        // 'evm.bytecode.linkReferences',
        'evm.deployedBytecode',
        'evm.methodIdentifiers',
        'evm.gasEstimates',
      ],
    },
  },
}

async function compile(filepath, contract, format = 'RAW', outputSelection) {
  const files = await globby([
    '**/*.sol',
    '!test',
    '!tmp',
  ])

  const fileMap = createFileMap(files)

  let settings

  if (fs.existsSync('solc.json')) {
    settings = JSON.parse(fs.readFileSync('solc.json'))
  }
  else {
    settings = defaultSettings
  }

  if (outputSelection.length) {
    settings.outputSelection = {'*': {'*': outputSelection}}
  }
  else {
    settings.outputSelection = settings.outputSelection || {'*': {'*': ['*']}}
  }

  const compilerOptions = {
    language: 'Solidity',
    sources: {
      [filepath]: {
        content: fileMap[filepath],
      },
    },
    settings,
  }

  const loader = (filepath) => {
    if (fileMap.hasOwnProperty(filepath)) {
      return {contents: fileMap[filepath]}
    }

    if (fs.existsSync(path.join('node_modules', filepath))) {
      return {
        contents: fs.readFileSync(path.join('node_modules', filepath), 'utf8'),
      }
    }

    return {error: `File "${filepath}" not found`}
  }

  const output = compileStandard(compilerOptions, loader)

  let errors = []
  let result

  if ('errors' in output) {
    errors = output.errors
  }

  if (output.contracts && output.contracts.hasOwnProperty(filepath)) {
    if (! contract) {
      contract = path.filename(filepath, path.extname(filepath))
    }

    if (contract in output.contracts[filepath] === false) {
      throw `Not a contract "${contract}"`
    }

    result = formatOutput(format, output.contracts[filepath][contract])
  }

  return {errors, result}
}

function compileStandard(compilerOptions, loader) {
  return JSON.parse(
    solc.compileStandard(JSON.stringify(compilerOptions), loader)
  )
}

function createFileMap(files) {
  const cache = {}

  const fileMap = files.reduce((result, file) => {
    Object.defineProperty(result, file, {
      get() {
        if (! cache.hasOwnProperty(file)) {
          cache[file] = fs.readFileSync(file, 'utf8')
        }

        return cache[file]
      },
    })

    return result
  }, {})

  return fileMap
}

function formatOutput(format, output) {
  switch (format.toUpperCase()) {
  case 'JSON':
    return formatJson(output, true)
  case 'JSON-MIN':
    return formatJson(output)
  case 'MODULE': {
    const result = []
    for (const prop of Object.getOwnPropertyNames(output)) {
      result.push(`export const ${prop} = ${jsStringify(output[prop], null, 2)}`)
    }
    return result.join(';\n\n')
  }
  case 'CJS': {
    const result = []
    for (const prop of Object.getOwnPropertyNames(output)) {
      result.push(`exports.${prop} = ${jsStringify(output[prop], null, 2)}`)
    }
    return result.join(';\n\n')
  }
  case 'RAW':
  default:
    return inspect(output, {colors: process.stdin.isTTY, depth: Infinity})
  }
}

function formatJson(output, isPretty = false) {
  return JSON.stringify(output, null, isPretty ? 2 : 0)
}

async function compileAction(options) {
  const {source, contract, selection, format} = options

  const {errors, result} = await compile(source, contract, format, selection)

  if (errors.length) {
    let hasError = false
    errors.forEach(({severity, formattedMessage}) => {
      let color
      if (severity === 'error') {
        color = 'red'
        hasError = true
      }
      else {
        color = 'yellow'
      }

      console.error('[%s]: %s', ch[color](severity.toUpperCase()), formattedMessage)
    })

    if (hasError) {
      return 1
    }
  }

  console.log(result)
}

module.exports = compileAction
