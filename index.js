const path = require('path')
const os = require('os')
const cpuArch = os.arch()
module.exports = path.join(__dirname, './assets/bin', cpuArch)