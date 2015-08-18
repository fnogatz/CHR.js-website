/* global URI, Worker */

module.exports = Parser

const BASE_URI = URI
const PARSERWORKER_URI = BASE_URI + '/public/js/playground/parserworker.js'

function Parser (cbOnStart, cbOnEnd) {
  this.onStart = function () {}
  this.onEnd = function () {}
  this.onError = function () {}

  this.worker = new Worker(PARSERWORKER_URI)

  this._setEventListener()
}

Parser.prototype.parse = function (type, source, data) {
  data = data || {}
  this.onStart()

  this.worker.postMessage({
    type: type,
    source: source,
    data: data
  })
}

Parser.prototype._setEventListener = function () {
  var self = this
  var worker = this.worker

  worker.addEventListener('message', function (obj) {
    var data = obj.data

    if (data.error) {
      self.onError(data.type, data.error)
      return
    }

    // Successfully parsed
    self.onEnd(data.type, data.parsed, data.data)
  })
}
