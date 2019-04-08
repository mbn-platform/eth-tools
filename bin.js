#!/usr/bin/env node

const coa = require('coa')

const cmd = coa.Cmd()
.name(process.argv[1])
.title('EthTools is an all in one management tool for solidity development and contract management')
.helpful()

const commands = {
  compile: './commands/compile',
}

for (const [name, filepath] of Object.entries(commands)) {
  const fn = require(filepath)
  if (typeof fn !== 'function') {
    throw new Error(`Invalid command ${name}`)
  }

  fn(cmd.cmd().name(name))
}

cmd.run()
