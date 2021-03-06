/* global URI, jailed */

module.exports = Solver

const BASE_URI = URI
const CHRWORKER_URI = BASE_URI + '/public/js/playground/chrworker.js'
const CHR_URI = BASE_URI + '/public/js/playground/chr-wop.js'

function Solver (opts) {
  var self = this

  this._pluginConnected = false
  this._pluginConnectionTry = 0

  this.onStart = function () {}
  this.onError = function () {}
  this.onEnd = function () {}
  this.onBreakpoint = function () {}
  this.onStoreEvent = function () {}

  this.getOptions = function () {
    return {}
  }

  opts = opts || {}
  opts.queryInput = opts.queryInput || null

  var plugin = new jailed.Plugin(CHRWORKER_URI, {
    setInfo: setInfo,
    queryFinished: queryFinished,
    breakpoint: breakpoint,
    storeEvent: storeEvent
  })

  plugin.whenConnected(function () {
    // load CHR.js into variable `CHR` in plugin context
    plugin.remote.loadCHR(CHR_URI)

    self._pluginConnected = true
  })

  this.plugin = plugin

  this.queryInput = opts.queryInput

  function setInfo (info) {
    self.info = info
    self.setupQueryInput()
  }

  function queryFinished (data) {
    if (data && data.hasOwnProperty('error')) {
      self.onError(data.error)
      return
    }

    self.onEnd(data)
  }

  function breakpoint (data) {
    self.onBreakpoint(data)
  }

  function storeEvent (data) {
    self.onStoreEvent(data)
  }
}

/**
 * Time in milliseonds to try to reconnect the
 *   plugin if not loaded yet.
 * @type {Number}
 */
Solver.RETRYTIME = 200
Solver.MAXRETRIES = 5

Solver.prototype.setSource = function (parsed) {
  var self = this
  var opts = this.getOptions() || {}

  if (!this._pluginConnected) {
    if (++this._pluginConnectionTry === Solver.MAXRETRIES) {
      this.onError('Could not connect to remote solver plugin.')
      return
    }

    setTimeout(function () {
      self.setSource(parsed)
    }, Solver.RETRYTIME)

    return
  }

  this.plugin.remote.setSource(parsed, opts)
  this._pluginConnectionTry = 0
}

Solver.prototype.callQuery = function (parsed, opts) {
  this.onStart()

  this.plugin.remote.callQuery(parsed)
}

Solver.prototype.killConstraint = function (constraintId) {
  this.plugin.remote.killConstraint(constraintId)
}

Solver.prototype.continueBreakpoint = function () {
  this.plugin.remote.continueBreakpoint()
}

Solver.prototype.getStore = function (callback) {
  this.plugin.remote.getStore(function (store) {
    callback(store)
  })
}

Solver.prototype.setupQueryInput = function () {
  var self = this

  if (!this.queryInput) {
    return
  }

  this.queryInput.textcomplete([
    {
      context: function (text) {
        var braces = 0
        for (var i = 0; i < text.length; i++) {
          if (text[i] === '(') {
            braces++
          } else if (text[i] === ')') {
            braces--
          }

          if (braces < 0) {
            return false
          }
        }

        return braces === 0
      },
      match: /(^|[\s,])([a-z][A-z0-9_]*)?$/,
      index: 2,
      search: function (term, callback) {
        var matching = []
        for (var i = 0; i < self.info.functors.length; i++) {
          if (self.info.functors[i].indexOf(term) === 0) {
            matching.push(self.info.functors[i])
          }
        }
        callback(matching)
      },
      replace: function (functor) {
        var name = functor.split('/')[0]
        var args = parseInt(functor.split('/')[1], 10)

        if (args > 0) {
          return ['$1' + name + '(', Array(args).join(',') + ')']
        }

        return '$1' + name
      }
    }
  ])
}
