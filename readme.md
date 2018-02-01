# net-cipher

[![build status](http://img.shields.io/travis/chiefbiiko/net-cipher.svg?style=flat)](http://travis-ci.org/chiefbiiko/net-cipher) [![AppVeyor Build Status](https://ci.appveyor.com/api/projects/status/github/chiefbiiko/net-cipher?branch=master&svg=true)](https://ci.appveyor.com/project/chiefbiiko/net-cipher)

***

A simple stream cipher.

***

## Get it!

```
npm install --save net-cipher
```

***

## Usage

```js
/*...*/
```

***

## API

### `var cipher = cipherConnection([onconnection])`

Create a new cipher function that will encrypt any stream passed to it as first argument. Its signature is `cipher(stream[, onconnection])`, with the `onconnection` callback being mandatory only if it has not been supplied in the call of `cipherConnection`.

### `cipher(duplex[, onconnection])`

Encrypt any duplex stream, using the **ECDHE** protocol with Daniel Bernstein's `curve25519` to obtain a shared secret, which is in turn used as the seed for [`xor-stream-cipher`](https://github.com/chiefbiiko/xor-stream-cipher) instances that perform the actual en/decryption with a pseudo-random key stream. 

The callback has the signature `onconnection(err, duplex)` with `duplex` being the encrypted stream.

***

## License

[MIT](./license.md)
