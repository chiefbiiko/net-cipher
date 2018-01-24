// TODO: + get rid of stream.push() after EOF error

var crypto = require('crypto')
var net = require('net')
var pumpify = require('pumpify')
var EC = require('elliptic').ec

var ec = new EC('curve25519')

var STREAM_PUSH_AFTER_EOF = 'stream.push() after EOF'

function sha256 (buf) {
  return crypto.createHash('sha256').update(buf).digest()
}

function pbkdf2 () {

}

function isValid (allow, suspect) {
  suspect = Buffer.isBuffer(suspect) ? suspect : Buffer.from(suspect, 'hex')
  return allow.some(function (hash) {
    return hash.equals(suspect)
  })
}

// opts.cipherAlgorithm: string = 'aes256'
function createCipherGate (opts, oncipher) {
  if (typeof opts === 'function') {
    oncipher = opts
    opts = {}
  }

  if (!oncipher) throw Error('callback is not a function')

  // default options
  if (!opts) opts = {}
  opts.cipherAlgorithm = opts.cipherAlgorithm || 'aes256'

  function gate (socket) {
    // getting the soocket's remote address
    // var addy = socket.remoteAddress + ':' + socket.remotePort
    // if (socket.bytesRead || blacklist.includes(addy)) return

    // crypto setup
    var keypair = ec.genKeyPair()
    var pubkey = Buffer.from(keypair.getPublic('binary'))
    var encrypt
    var decrypt
    var pw

    socket.once('readable', function readable () {
      // sending server's pubkey
      socket.write(pubkey)
      // getting client's pubkey
      var otherPubkey = socket.read(32)
      // computing the shared secret
      var shared = keypair.derive(ec.keyFromPublic(otherPubkey).getPublic())
      // hashing the shared secret to a pw 4 use with symmetric encryption
      pw = sha256(shared.toString(16))
      // initialising en/decryption streams with our shared pw
      encrypt = crypto.createCipher(opts.cipherAlgorithm, pw)
      decrypt = crypto.createDecipher(opts.cipherAlgorithm, pw)
      // encrypt.setAutoPadding(false)
      // decrypt.setAutoPadding(false)
      // hack away that nasty error
      var pumpline = pumpify(encrypt, socket, decrypt)
      // cipher
      oncipher(null, pumpline)
      // oncipher(null, socket)
    })

  }

  return gate
}

function cipherEstablish (socket, opts, onestablished) {
  if (typeof opts === 'function') {
    onestablished = opts
    opts = {}
  }

  if (!onestablished) throw Error('callback is not a function')

  // options
  if (!opts) opts = {}
  opts.cipherAlgorithm = opts.cipherAlgorithm || 'aes256'
  // ECDHE keys
  var keypair = ec.genKeyPair()
  var pubkey = Buffer.from(keypair.getPublic('binary'))
  // sending client's pubkey
  socket.write(pubkey)

  // registering a one-time readable handler
  socket.once('readable', function () {
    // getting the server's pubkey
    var otherPubkey = socket.read(32)
    // computing the shared secret
    var shared = keypair.derive(ec.keyFromPublic(otherPubkey).getPublic())
    // hashing the shared secret to a pw 4 use with symmetric encryption
    var pw = sha256(shared.toString(16))
    // de/cipher streams
    var encrypt = crypto.createCipher(opts.cipherAlgorithm, pw)
    var decrypt = crypto.createDecipher(opts.cipherAlgorithm, pw)
    // encrypt.setAutoPadding(false)
    // decrypt.setAutoPadding(false)
    // hacky
    var pumpline = pumpify(encrypt, socket, decrypt)
    // cipher
    onestablished(null, pumpline)
    // onestablished(null, socket)
  })

}

module.exports = {
  createCipherGate: createCipherGate,
  cipherEstablish: cipherEstablish
}
