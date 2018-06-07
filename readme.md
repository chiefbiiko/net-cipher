# net-cipher

[![build status](http://img.shields.io/travis/chiefbiiko/net-cipher.svg?style=flat)](http://travis-ci.org/chiefbiiko/net-cipher) [![AppVeyor Build Status](https://ci.appveyor.com/api/projects/status/github/chiefbiiko/net-cipher?branch=master&svg=true)](https://ci.appveyor.com/project/chiefbiiko/net-cipher)

***

An encryption utility for `net` servers and clients, generally node duplex streams. Features message authentication.

***

## Get it!

```
npm install --save net-cipher
```

***

## Usage

The `usage` directory contains an example server and client that demonstrate how to establish an encrypted and authenticated TCP connection.

### Server

Run `node ./usage/server` to start the demo server below.

``` js
var net = require('net')
var cipherConnection = require('net-cipher')

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
```

### Client

Then, run `node ./usage/client` to connect to the demo server with the client below.

``` js
var net = require('net')
var cipherConnection = require('net-cipher')

var clientCipher = cipherConnection()

function oncipherconnect (err, socket) {
  if (err) return console.error(err)
  socket.end('fun stuff')
}

var socket = net.connect(419, '127.0.0.1', function () {
  clientCipher(socket, oncipherconnect)
})
```

***

## API

### `var cipher = cipherConnection([opts][, oncipher])`

Create a function that is capable of encrypting and authenticating any duplex stream.

Options default to:

``` js
{
  algo: 'alea',
  mac: true,
  delimiter: Buffer.from([ 0x00, 0x04, 0x01, 0x09, 0x04, 0x01, 0x09, 0x00 ])
}
```

`opts.algo` indicates the algorithm to use as the random number generator for the keystreams of internal [`xor-stream-cipher`](https://github.com/chiefbiiko/xor-stream-cipher) and [`siphash24-stream`](https://github.com/chiefbiiko/siphash24-stream) instances, defaults to `'alea'`. Check out  [`seedrandom`](https://github.com/davidbau/seedrandom#other-fast-prng-algorithms) for a list of supported algorithms. `opts.mac` indicates whether to incorporate a message authentication check via [`siphash24-stream`](https://github.com/chiefbiiko/siphash24-stream). `opts.delimiter` indicates the message boundary to use for the (optional) message authentication procedure, must be a buffer.

Optionally, pass a function, sig `oncipher(err, duplex)`, and it will be bound to `cipher` as its callback.

The returned function, `cipher`, is designed to be the very first connection handler to be used with `net.createServer`, `net.connect`, and alike.

### `cipher(duplex[, oncipher])`

Encrypt any duplex stream by using the **ECDHE** protocol with Daniel Bernstein's **_curve25519_** to obtain a shared secret, which is in turn used to seed pseudo-random keystreams of [`xor-stream-cipher`](https://github.com/chiefbiiko/xor-stream-cipher) and [`siphash24-stream`](https://github.com/chiefbiiko/siphash24-stream) instances that perform the actual en/decryption and message authentication.

The callback has the signature `oncipher(err, duplex)` with `duplex` being the encrypted stream. `oncipher` is required, and will only be considered, if it has **not** been passed in the call of `cipherConnection`.

***

## License

[MIT](./license.md)
