const fs = require('fs');
const path = require('path');

function readSrcFile(file) {
  const res = fs.readFileSync(path.resolve(__dirname, '../../src/', file), 'utf-8');
  return res;
}

function wait(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

module.exports = { readSrcFile, wait };
