const fs = require('fs')

function readJson(filepath) {
  return JSON.parse(
    fs.readFileSync(filepath, 'utf8')
  )
}

function writeJson(filepath, content) {
  return fs.writeFileSync(
    filepath,
    JSON.stringify(content, null, 2),
    'utf8',
  )
}

exports.readJson = readJson
exports.writeJson = writeJson
