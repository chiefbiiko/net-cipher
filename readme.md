# net-cipher

[![build status](http://img.shields.io/travis/chiefbiiko/net-cipher.svg?style=flat)](http://travis-ci.org/chiefbiiko/net-cipher) [![AppVeyor Build Status](https://ci.appveyor.com/api/projects/status/github/chiefbiiko/net-cipher?branch=master&svg=true)](https://ci.appveyor.com/project/chiefbiiko/net-cipher)

***

An encryption utility for duplex streams and related fun stuff.

***

## Get it!

```
npm install --save net-cipher
```

***

## Usage

``` js
var net = require('net')
var cipherConnection = require('net-cipher')

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

server.listen(10000, '127.0.0.1', function () {
  var socket = net.connect(10000, '127.0.0.1', function () {
    clientCipher(socket, oncipherconnect)
  })
})
```

***

## API

### `var cipher = cipherConnection([oncipher])`

Create a function that is capable of encrypting any duplex stream. Pass a function, sig `oncipher(err, duplex)`, and it will be bound to `cipher` as its callback.
`cipher` is designed to be the very first connection handler to be used with `net.createServer`, `net.connect`, and alike.

### `cipher(duplex[, oncipher])`

Encrypt any duplex stream, using the **ECDHE** protocol with Daniel Bernstein's **_curve25519_** to obtain a shared secret, which is in turn used to seed [`xor-stream-cipher`](https://github.com/chiefbiiko/xor-stream-cipher) instances that perform the actual en/decryption with a pseudo-random key stream.

The callback has the signature `oncipher(err, duplex)` with `duplex` being the encrypted stream. `oncipher` is required, and will only be considered, if it has **not** been passed in the call of `cipherConnection`.

***

## License

[MIT](./license.md)
