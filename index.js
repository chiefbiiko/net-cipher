var crypto = require('crypto')
var multipipe = require('multipipe')
var EC = require('elliptic').ec
var XOR = require('xor-stream-cipher')
var sip = require('siphash24-stream')

var ec = new EC('curve25519')

function noop () {}

function sha512 (buf) {
  return crypto.createHash('sha512').update(buf).digest()
}

function createCipherDuplet (init, algo) {
  return {
    cipher: XOR(init, algo),
    decipher: XOR(init, algo)
  }
}

function handshake (keypair, opts, onhandshake) {
  // getting other pubkey
  var otherPubkey = this.read(32)
  // computing the shared secret
  var shared = keypair.derive(ec.keyFromPublic(otherPubkey).getPublic())
  // key stretching
  var stretched = sha512(shared.toArrayLike(Buffer))
  // seeding de/cipher streams with our shared secret
  var { cipher, decipher } = createCipherDuplet(stretched, opts.algo)
  // multivitamin - multiple duplex streams combined
  var multi
  // maybe do a message authentication check
  if (opts.mac) { // encrypt-then-mac
    var { sign, verify } = sip.createSipHash24Streams(stretched, opts)
    multi = multipipe(cipher, sign, this, verify, decipher)
    verify.on('dropping', multi.emit.bind(multi, 'dropping')) // pass da event
  } else {
    multi = multipipe(cipher, this, decipher)
  }
  // pass socket's address info
  multi.remoteAddress = this.remoteAddress
  multi.remotePort = this.remotePort
  // unregister error trapper
  this.removeListener('error', this.listeners('error')[0])
  // cipher
  onhandshake(null, multi)
}

function prehandshake (opts, onhandshake, socket) {
  // allow noop cb
  if (!onhandshake) onhandshake = noop
  // trapping socket errors
  socket.prependOnceListener('error', onhandshake)
  // crypto setup
  var keypair = ec.genKeyPair()
  var pubkey = Buffer.from(keypair.getPublic('binary'))
  // sending own pubkey
  socket.write(pubkey)
  // handshaking
  socket.once('readable', handshake.bind(socket, keypair, opts, onhandshake))
}

function clientprehandshake (opts, socket, onhandshake) {
  prehandshake(opts, onhandshake, socket)
}

function cipherConnection (opts, onhandshake) {
  if (typeof opts === 'function') {
    onhandshake = opts
    opts = {}
  }

  if (!opts) opts = {}

  opts.algo = opts.algo || 'alea'
  opts.mac = opts.mac !== false

  if (onhandshake) return prehandshake.bind(null, opts, onhandshake)
  else return clientprehandshake.bind(null, opts)
}

module.exports = cipherConnection
