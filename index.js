var multipipe = require('multipipe')
var EC = require('elliptic').ec
var XOR = require('xor-stream-cipher')

var ec = new EC('curve25519')

function createCipherDuplet (init, algo) {
  return {
    cipher: XOR(init, algo),
    decipher: XOR(init, algo)
  }
}

function handshake (keypair, algo, cb) {
  // getting other pubkey
  var otherPubkey = this.read(32)
  // computing the shared secret
  var shared = keypair.derive(ec.keyFromPublic(otherPubkey).getPublic())
  // seeding de/cipher streams with our shared secret
  var { cipher, decipher } = createCipherDuplet(shared, algo)
  // multivitamin
  var multi = multipipe(cipher, this, decipher)
  multi.remoteAddress = this.remoteAddress
  multi.remotePort = this.remotePort
  // cipher
  cb(null, multi)
}

function prehandshake (algo, onhandshake, socket) {
  // crypto setup
  var keypair = ec.genKeyPair()
  var pubkey = Buffer.from(keypair.getPublic('binary'))
  // sending own pubkey
  socket.write(pubkey)
  // handshaking
  socket.once('readable', handshake.bind(socket, keypair, algo, onhandshake))
}

function clientprehandshake (algo, socket, onhandshake) {
  prehandshake(algo, onhandshake, socket)
}

function cipherConnection (algo, onhandshake) {
  if (typeof algo === 'function') {
    onhandshake = algo
    algo = 'alea'
  }

  if (onhandshake) return prehandshake.bind(null, algo, onhandshake)
  else return clientprehandshake.bind(null, algo)
}

module.exports = cipherConnection
