const fs = require('fs');
const TEMPLATE = fs.readFileSync('./template.js');
const IPC = {
  STATE: 'state',
  ACTION: 'action'
};
module.exports = { TEMPLATE, IPC };
