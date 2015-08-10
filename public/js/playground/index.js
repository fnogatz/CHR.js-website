(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = Editor

const DELAY = 800

function Editor (editor) {
  this.editor = editor
  this.delay = DELAY

  this.onChange = function () {}

  this._oldSource = null
  this._timer = null

  this.setListeners()
}

Editor.prototype.setListeners = function () {
  var self = this
  var editor = self.editor

  // trigger cursor or selection moves or any change is made
  editor.on('cursorActivity', self.scheduleBuild.bind(self))
  editor.on('focus', self.scheduleBuild.bind(self))
  editor.on('keydown', self.scheduleBuild.bind(self))
  editor.on('keypress', self.scheduleBuild.bind(self))
  editor.on('keyup', self.scheduleBuild.bind(self))
  editor.on('mousedown', self.scheduleBuild.bind(self))
  editor.on('mouseup', self.scheduleBuild.bind(self))
}

Editor.prototype.scheduleBuild = function () {
  var self = this
  var editor = self.editor

  var nothingChanged = editor.getValue() === self._oldSource
  if (nothingChanged) {
    return
  }

  if (self._timer !== null) {
    clearTimeout(self._timer)
    self._timer = null
  }

  self._timer = setTimeout(function () {
    self.build()
    self._timer = null
  }, self.delay)
}

Editor.prototype.build = function () {
  var self = this
  var editor = self.editor

  var source = editor.getValue()
  self._oldSource = source

  self.onChange(source)
}

},{}],2:[function(require,module,exports){
/* global CodeMirror, $ */

var Editor = require('./editor')
var Parser = require('./parser')
var Solver = require('./solver')
var util = require('./util')

$(document).ready(function () {
  var parser
  var solver

  var jq = {
    notifications: $('#notifications > *'),
    spinner: $('#spinner'),
    parsingErrorNotification: $('#notification-parsing-error'),
    queryErrorNotification: $('#notification-query-error'),
    queryButton: $('#query button'),
    queryInput: $('#query input'),
    store: $('#store tbody'),
    clearStore: $('#clearStore')
  }

  parser = new Parser()
  parser.onStart = function () {
    jq.spinner.show()
    util.hide(jq.notifications)
  }
  parser.onError = function (type, error) {
    jq.spinner.hide()
    util.hide(jq.notifications)

    if (type === 'source') {
      $('#notification-parsing-error .type').text('source code')
      $('#notification-parsing-error .mesg').text(error)
      util.show(jq.parsingErrorNotification)
    }

    if (type === 'query') {
      $('#notification-parsing-error .type').text('query')
      $('#notification-parsing-error .mesg').text(error)
      util.show(jq.parsingErrorNotification)
    }
  }
  parser.onEnd = function (type, parsed) {
    jq.spinner.hide()
    util.hide(jq.notifications)

    if (type === 'source') {
      solver.setSource(parsed)
      return
    }

    if (type === 'query') {
      solver.callQuery(parsed)
      return
    }
  }

  solver = new Solver({
    queryInput: jq.queryInput
  })
  solver.onStart = function () {
    jq.spinner.show()
    util.hide(jq.notifications)
  }
  solver.onError = function (error) {
    $('#notification-query-error .mesg').text(error)
    jq.queryErrorNotification.show()
  }
  solver.onEnd = function (data) {
    jq.queryInput.val('')
    jq.spinner.hide()

    if (data && data.store) {
      updateStoreView(data.store)
    }
  }

  // initialize CodeMirror editor
  var editor = CodeMirror.fromTextArea($('#source').get(0), {
    lineNumbers: true,
    theme: 'monokai',
    styleActiveLine: true,
    matchBrackets: true
  // , mode: 'chr'
  })

  $('.CodeMirror').click(function () {
    // prevent calling the $('#source-col').click() event handler
    return false
  })

  // focus editor if source column clicked
  $('#source-col').click(function () {
    editor.setCursor(editor.lineCount(), 0)
    editor.focus()
  })

  var e = new Editor(editor)
  e.onChange = function (source) {
    // give new source to parser
    parser.parse('source', source)
  }

  // focus editor once page is loaded
  editor.focus()

  jq.queryButton.click(function () {
    var query = jq.queryInput.val()
    parser.parse('query', query)
  })
  jq.queryInput.keypress(function (e) {
    if (e.which === 13) {
      jq.queryButton.click()
    }
  })

  $('#notifications > div button.close').click(function (e) {
    $(this).parent().fadeOut()
  })

  $('#clearStore').click(function (e) {
    clearStore()
  })

  function updateStoreView (store) {
    // clear table
    jq.store.empty()

    if (store.length === 0) {
      jq.store.append('<tr><td></td><td>(empty)</td></tr>')
      $('#clearStore').hide()
      return
    }

    // add rows
    store.forEach(function (constraint) {
      var html = '<tr data-constraint-id="' + constraint.id + '"><td>' + constraint.id + '</td><td><code>' + constraint.string + '</code>'
      html += '<button type="button" title="Remove" class="close remove-constraint" data-constraint-id="' + constraint.id + '">×</button>'
      // html += '<button type="button" title="Reactivate" class="close reactivate-constraint" data-constraint-id="'+constraint.id+'">✓</button>'
      html += '</td></tr>'
      jq.store.append(html)

      jq.store.find('button.remove-constraint').on('click', removeConstraint)
      jq.store.find('button.reactivate-constraint').on('click', reactivateConstraint)
    })

    jq.clearStore.show()
  }

  function reactivateConstraint () {
    // TODO
  }

  function removeConstraint (id) {
    var constraintId
    if (typeof id === 'string') {
      constraintId = id
    } else {
      constraintId = $(this).data('constraintId')
    }
    solver.killConstraint(constraintId)

    jq.store.find('tr[data-constraint-id="' + constraintId + '"]').remove()
    if (jq.store.find('tr').length === 0) {
      jq.store.append('<tr><td></td><td>(empty)</td></tr>')
      $('#clearStore').hide()
    }
  }

  function clearStore () {
    jq.store.find('tr').each(function (row) {
      if ($(this).attr('data-constraint-id')) {
        removeConstraint($(this).attr('data-constraint-id'))
      }
    })
  }
})

},{"./editor":1,"./parser":3,"./solver":4,"./util":5}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
/* global URI, jailed */

module.exports = Solver

const BASE_URI = URI
const CHRWORKER_URI = BASE_URI + '/public/js/playground/chrworker.js'
const CHR_URI = BASE_URI + '/public/js/playground/chr-wop.js'

function Solver (opts) {
  var self = this

  this.onStart = function () {}
  this.onError = function () {}
  this.onEnd = function () {}

  opts = opts || {}
  opts.queryInput = opts.queryInput || null

  var plugin = new jailed.Plugin(CHRWORKER_URI, {
    setInfo: setInfo,
    queryFinished: queryFinished
  })

  plugin.whenConnected(function () {
    // load CHR.js into variable `CHR` in plugin context
    plugin.remote.loadCHR(CHR_URI)
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
    return
  }
}

Solver.prototype.setSource = function (parsed) {
  this.plugin.remote.setSource(parsed)
}

Solver.prototype.callQuery = function (parsed) {
  this.onStart()

  this.plugin.remote.callQuery(parsed)
}

Solver.prototype.killConstraint = function (constraintId) {
  this.plugin.remote.killConstraint(constraintId)
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

},{}],5:[function(require,module,exports){
module.exports = {}
module.exports.show = show
module.exports.hide = hide

function show (sel) {
  sel.removeClass('inactive')
}

function hide (sel) {
  sel.addClass('inactive')
}

},{}]},{},[2]);
