var net = require('net')
var cipherConnection = require('./../index')

var server = net.createServer(cipherConnection(oncipherconnection))

function oncipherconnection (err, socket) {
  if (err) return console.error(err)
  socket.once('data', function ondata (chunk) {
    console.log(chunk.toString()) // prints whatever the client sent
    server.close()
  })
}

server.listen(419, '127.0.0.1', function () {
  var addy = server.address()
  console.log('server live @ ' + addy.address + ':' + addy.port)
})
