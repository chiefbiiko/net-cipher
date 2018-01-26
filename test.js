var tape = require('tape')
var net = require('net')

var createCipherGate = require('./index').createCipherGate
var cipherEstablish = require('./index').cipherEstablish

function noop () {}

tape('encryption', function (t) {

  var gate = createCipherGate(oncipher)
  var server = net.createServer(gate)

  function oncipher (err, cipher, socket, decipher) {

    t.false(err, 'crypto successfull')

    server.close()
    socket.destroy()
    t.end()
  }

  // function oncipher (err, socket) {
  //
  //   t.false(err, 'crypto successfull')
  //
  //   server.close()
  //   socket.destroy()
  //   t.end()
  // }

  server.listen(10000, 'localhost', function () {
    var client = net.connect(10000, 'localhost', function () {
      cipherEstablish(client, noop)
    })
  })

})

tape('lossless roundtrip', function (t) {

  function onconnection (err, cipher, socket, decipher) {
    if (err) t.end(err)
    cipher.pipe(socket)
    cipher.write('fraud world')
    cipher.end()
  }

  // function onconnection (err, socket) {
  //   if (err) t.end(err)
  //   socket.write('fraud world')
  //   socket.end()
  // }

  var gate = createCipherGate(onconnection)
  var server = net.createServer(gate)

  function onconnect (err, cipher, socket, decipher) {
    if (err) t.end(err)

    socket.pipe(decipher)

    decipher.once('data', function (chunk) {

      t.equal(chunk.toString(), 'fraud world', 'cipher roundtrip')

      server.close()
      t.end()
    })
  }

  // function onconnect (err, socket) {
  //   if (err) t.end(err)
  //
  //   socket.once('data', function (chunk) {
  //
  //     t.equal(chunk.toString(), 'fraud world', 'cipher roundtrip')
  //
  //     server.close()
  //     t.end()
  //   })
  // }

  server.listen(10000, 'localhost', function () {
    var client = net.connect(10000, 'localhost', function () {
      cipherEstablish(client, onconnect)
    })
  })

})
