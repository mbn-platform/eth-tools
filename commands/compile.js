const path = require('path')
const outdent = require('outdent')

const command = require('../coa/command')

const formats = [
  'JSON',
  'JSON-MIN',
  'RAW',
  'MODULE',
  'CJS',
]

const targets = [
  'tangerineWhistle',
  'spuriousDragon',
  'byzantium',
  'constantinopole',
  'petersburg',
]

module.exports = function (cmd) {
  cmd.title('Compile contract')
  cmd.helpful()

  cmd.opt()
  .name('target')
  .title(outdent`
    Compilation target. Could be: ${targets.join(', ')}.
    Default: ${targets[targets.length - 1]}.`)
  .short('t')
  .val((target) => {
    if (! targets.includes(target)) {
      throw `Uknown target "${target}"`
    }
    return target
  })
  .long('target')

  cmd.opt()
  .name('selection')
  .title('Output selection. Default is "*"')
  .short('s')
  .val((value) => {
    const trimmed = value.trim()
    if (trimmed.length) {
      return trimmed.split(/\s*,\s*/)
    }
    else {
      return []
    }
  })
  .def('')
  .long('select')

  cmd.opt()
  .name('format')
  .title(outdent`
    Output format. Could be: ${formats.join(', ')}. Default is ${formats[formats.length - 1]}.
  `)
  .short('f')
  .val((output) => {
    const upperCased = output.toUpperCase()
    if (! formats.includes(upperCased)) {
      throw `Uknown output format "${output}"`
    }
    return upperCased
  })
  .long('format')
  .def('JSON')

  cmd.arg()
  .name('source')
  .title('Contract source filepath')
  .req()

  cmd.arg()
  .name('contract')
  .title('Contract to compile. If not set then all contracts will be compiled.')

  cmd.act(command((opts, {contract, source, ...args}) => {
    if (! contract) {
      contract = path.basename(source, path.extname(source))
    }

    const runAction = require('../actions/compile')
    return runAction({
      ...opts,
      ...args,
      source,
      contract,
    })
  }))
}
