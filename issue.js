var crypto = require('crypto')
var stream = require('stream')
var pumpify = require('pumpify')

var socket = new stream.PassThrough()

var pw = 'secret'
var cipher = crypto.createCipher('aes256', pw)
var decipher = crypto.createDecipher('aes256', pw)

var pumpline = pumpify(cipher, socket, decipher)

pumpline.on('data', function ondata (chunk) {
  console.log(chunk.toString())
})

pumpline.end('fraud fraud fraud fraud')

// process.stdin.pipe(socket).pipe(process.stdout)
