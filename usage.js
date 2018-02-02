var net = require('net')
var cipherConnection = require('./index')

var server = net.createServer(cipherConnection(oncipherconnection))
var clientCipher = cipherConnection()

function oncipherconnection (err, socket) {
  if (err) return console.error(err)
  socket.once('data', function ondata (chunk) {
    console.log(chunk.toString()) // fun stuff
    server.close()
  })
}

function oncipherconnect (err, socket) {
  if (err) return console.error(err)
  socket.end('fun stuff')
}

server.listen(419, '127.0.0.1', function () {
  var socket = net.connect(419, '127.0.0.1', function () {
    clientCipher(socket, oncipherconnect)
  })
})
