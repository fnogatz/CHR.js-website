/* global URI, Worker */

module.exports = Parser

const BASE_URI = URI
const PARSERWORKER_URI = BASE_URI + '/public/js/playground/parserworker.js'

function Parser (cbOnStart, cbOnEnd) {
  this.onStart = function () {}
  this.onEnd = function () {}
  this.onError = function () {}

  this._worker = new Worker(PARSERWORKER_URI)

  this._setEventListener()
}

Parser.prototype.parse = function (type, source) {
  this._worker.postMessage({
    type: type,
    source: source
  })
}

Parser.prototype._setEventListener = function () {
  var self = this
  var worker = this._worker

  worker.addEventListener('message', function (obj) {
    var data = obj.data

    if (data.error) {
      self.onError(data.type, data.error)
      return
    }

    // Successfully parsed
    self.onEnd(data.type, data.parsed)
  })
}
