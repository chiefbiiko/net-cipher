var tape = require('tape')
var net = require('net')

var createCipherGate = require('./index').createCipherGate
var cipherEstablish = require('./index').cipherEstablish

function noop () {}

tape.only('encryption', function (t) {

  var gate = createCipherGate(oncipher)
  var server = net.createServer(gate)

  function oncipher (err, socket) {

    t.false(err, 'encrypted successfully')

    server.close()
    // how to destroy the socket w/out gettin stream.push after EOF
    socket.end()
    socket.destroy()
    t.end()
  }

  server.listen(10000, 'localhost', function () {
    var client = net.connect(10000, 'localhost', function () {
      cipherEstablish(client, noop)
    })
  })

})

tape('lossless roundtrip', function (t) {

  function fraud (err, socket) {
    if (err) t.end(err)
    socket.end('fraud world')
  }

  var gate = createCipherGate(fraud)
  var server = net.createServer(gate)

  function onestablished (err, socket) {
    if (err) t.end(err)
    socket.once('readable', function () {
      var chale = socket.read().toString()
      t.equal(chale, 'fraud world', 'cipher roundtrip')
      t.end()
    })
  }

  server.listen(10000, 'localhost', function () {
    var client = net.connect(10000, 'localhost', function () {
      cipherEstablish(client, onestablished)
    })
  })

})
