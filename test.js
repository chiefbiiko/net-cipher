var tape = require('tape')
var net = require('net')

var createGate = require('./index').createGate
var connect = require('./index').connect

function noop () {}

tape('encryption', function (t) {

  var gate = createGate(oncipher)
  var server = net.createServer(gate)

  // function oncipher (err, cipher, socket, decipher) {
  //
  //   t.false(err, 'crypto successfull')
  //
  //   server.close()
  //   socket.destroy()
  //   t.end()
  // }

  function oncipher (err, socket) {

    t.false(err, 'crypto successfull')

    server.close()
    socket.destroy()
    t.end()
  }

  server.listen(10000, '127.0.0.1', function () {
    var client = net.connect(10000, '127.0.0.1', function () {
      connect(client, noop)
    })
  })

})

tape('lossless roundtrip', function (t) {

  // function onconnection (err, cipher, socket, decipher) {
  //   if (err) t.end(err)
  //   cipher.pipe(socket)
  //   cipher.write('fraud world')
  //   cipher.end()
  // }

  function onconnection (err, socket) {
    if (err) t.end(err)
    socket.end(Buffer.from('fraud world'))
  }

  var gate = createGate(onconnection)
  var server = net.createServer(gate)

  // function onconnect (err, cipher, socket, decipher) {
  //   if (err) t.end(err)
  //
  //   socket.pipe(decipher)
  //
  //   decipher.once('data', function (chunk) {
  //
  //     t.equal(chunk.toString(), 'fraud world', 'cipher roundtrip')
  //
  //     server.close()
  //     t.end()
  //   })
  // }

  function onconnect (err, socket) {
    if (err) t.end(err)

    socket.once('data', function (chunk) {

      t.equal(chunk.toString(), 'fraud world', 'cipher roundtrip')

      server.close()
      t.end()
    })
  }

  server.listen(10000, '127.0.0.1', function () {
    var client = net.connect(10000, '127.0.0.1', function () {
      connect(client, onconnect)
    })
  })

})
