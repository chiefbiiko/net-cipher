var tape = require('tape')
var net = require('net')

var cipherConnection = require('./index')

function noop () {}

tape('encryption', function (t) {

  function oncipher (err, socket) {
    t.false(err, 'crypto')
    socket.destroy()
    server.close()
    t.end()
  }

  var server = net.createServer(cipherConnection(oncipher))
  var clientCipher = cipherConnection()

  server.listen(10000, '127.0.0.1', function () {
    var socket = net.connect(10000, '127.0.0.1', function () {
      clientCipher(socket, function (err, socket) {
        if (err) t.end(err)
      })
    })
  })

})

tape('error trapper', function (t) {

  function oncipher (err, socket) {
    t.true(err, 'errored successfully')
    server.close()
    t.end()
  }

  var server = net.createServer(cipherConnection(oncipher))

  server.listen(10000, '127.0.0.1', function () {
    var socket = net.connect(10000, '127.0.0.1', function () {
      socket.destroy()
    })
  })

})

tape('lossless roundtrip', function (t) {

  function onservercipher (err, socket) {
    if (err) t.end(err)
    socket.end(Buffer.from('fraud world'))
  }

  var server = net.createServer(cipherConnection(onservercipher))
  var clientCipher = cipherConnection()

  function onclientcipher (err, socket) {
    if (err) t.end(err)
    socket.once('data', function (chunk) {
      t.equal(chunk.toString(), 'fraud world', 'cipher roundtrip')
      server.close()
      t.end()
    })
  }

  server.listen(10000, '127.0.0.1', function () {
    var socket = net.connect(10000, '127.0.0.1', function () {
      clientCipher(socket, onclientcipher)
    })
  })

})

tape('address properties', function (t) {

  function onservercipher (err, socket) {
    if (err) t.end(err)
    t.ok(socket.remoteAddress, 'remote address')
    t.ok(socket.remotePort, 'remote port')
    socket.destroy()
    server.close()
    t.end()
  }

  var server = net.createServer(cipherConnection(onservercipher))
  var clientCipher = cipherConnection()

  server.listen(10000, '127.0.0.1', function () {
    var socket = net.connect(10000, '127.0.0.1', function () {
      clientCipher(socket, noop)
    })
  })

})
