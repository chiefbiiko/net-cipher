// TODO:
//   + get rid of stream.push() after EOF error
//   + use multipipeto make a single stream!!!
// onthefly cipher

var crypto = require('crypto')
var net = require('net')
var multipipe = require('multipipe')
var EC = require('elliptic').ec

var ec = new EC('curve25519')

function isFunc (x) {
  return x && Object.getPrototypeOf(x) === Function.prototype
}

function createCipherDuplet (algo, pw, opts) {
  var cipher = crypto.createCipher(algo, pw, opts)
  var decipher = crypto.createDecipher(algo, pw, opts)
  return {
    cipher: cipher,
    decipher: decipher
  }
}

function sha256 (buf) {
  return crypto.createHash('sha256').update(buf).digest()
}

function isValid (allow, suspect) {
  suspect = Buffer.isBuffer(suspect) ? suspect : Buffer.from(suspect, 'hex')
  return allow.some(function (hash) {
    return hash.equals(suspect)
  })
}

// opts.cipherAlgorithm: string = 'aes256'
function createGate (opts, onconnection) {
  if (typeof opts === 'function') {
    onconnection = opts
    opts = {}
  }

  if (!isFunc(onconnection)) throw Error('callback is not a function')

  // default options
  if (!opts) opts = {}
  opts.cipherAlgorithm = opts.cipherAlgorithm || 'aes256'

  function gate (socket) {
    // getting the soocket's remote address
    // var addy = socket.remoteAddress + ':' + socket.remotePort

    // crypto setup
    var keypair = ec.genKeyPair()
    var pubkey = Buffer.from(keypair.getPublic('binary'))

    socket.once('readable', function () {
      // sending server's pubkey
      socket.write(pubkey)
      // getting client's pubkey
      var otherPubkey = socket.read(32)
      // computing the shared secret
      var shared = keypair.derive(ec.keyFromPublic(otherPubkey).getPublic())
      // hashing the shared secret to a pw 4 use with symmetric encryption
      var pw = sha256(shared.toString(16))
      // initialising en/decryption streams with our shared pw
      var { cipher, decipher } = createCipherDuplet(opts.cipherAlgorithm, pw)
      // cipher
      // onconnection(null, cipher, socket, decipher)
      onconnection(null, multipipe(cipher, socket, decipher))
    })

  }

  return gate
}

function connect (socket, opts, onconnect) {
  if (typeof opts === 'function') {
    onconnect = opts
    opts = {}
  }

  if (!isFunc(onconnect)) throw Error('callback is not a function')

  // options
  if (!opts) opts = {}
  opts.cipherAlgorithm = opts.cipherAlgorithm || 'aes256'

  // crypto setup - ECDHE keys
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
    var { cipher, decipher } = createCipherDuplet(opts.cipherAlgorithm, pw)
    // cipher
    // onconnect(null, cipher, socket, decipher)
    onconnect(null, multipipe(cipher, socket, decipher))
  })

}

module.exports = {
  createGate: createGate,
  connect: connect
}
