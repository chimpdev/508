const winston = require('winston');

module.exports.send = function (message) {
  console.log(`${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}: ${message}`);
}