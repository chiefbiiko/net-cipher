var net = require('net')
var cipherConnection = require('./../index')

var clientCipher = cipherConnection()

function oncipherconnect (err, socket) {
  if (err) return console.error(err)
  socket.end('fun stuff')
}

var socket = net.connect(419, '127.0.0.1', function () {
  clientCipher(socket, oncipherconnect)
})
