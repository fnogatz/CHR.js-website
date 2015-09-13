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

Editor.prototype.build = function (opts) {
  var self = this
  var editor = self.editor

  var source = editor.getValue()
  self._oldSource = source

  self.onChange(source, opts)
}

Editor.prototype.setValue = function (value) {
  this.editor.setValue(value)
  this.scheduleBuild()
}

Editor.prototype.deactivate = function deactivate () {
  var editor = this.editor

  editor.setOption('readOnly', 'nocursor')
}

Editor.prototype.reactivate = function reactivate () {
  var editor = this.editor

  editor.setOption('readOnly', false)
}

Editor.prototype.highlight = function highlight (data) {
  var editor = this.editor

  var location = data.location
  var className = 'marker mark-' + data.event.replace(':', '-')

  return editor.markText({
    line: location.start.line - 1,
    ch: location.start.column - 1
  }, {
    line: location.end.line - 1,
    ch: location.end.column - 1
  }, {
    className: className
  }) || { clear: function () {} }
}

},{}],2:[function(require,module,exports){
/* global CodeMirror, $, Gister */

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
    gistErrorNotification: $('#notification-gist-error'),
    queryButton: $('#query button'),
    queryInput: $('#query input'),
    compileButton: $('#compile-button'),
    store: $('#store tbody'),
    clearStore: $('#clear-store'),
    switchAutocompilation: $('input[name="cb-live-compilation"]'),
    switchPersistentStore: $('input[name="cb-persistent-store"]'),
    switchTracing: $('input[name="cb-tracing"]'),
    switchTraceAutoplay: $('input[name="cb-trace-autoplay"]'),
    gistSave: $('#gist-save'),
    traceLog: $('#trace-log'),
    traceLogPanel: $('#trace-log .panel-body'),
    tracerSettings: $('#tracer-settings .dropdown-menu'),
    tracerSettingsOptions: $('#tracer-settings .dropdown-menu a:has(input[type="checkbox"])'),
    tracerSpeed: $('#tracer-speed')
  }

  var marker
  var tracerOptions = []
  var nextStepTimer
  var duration = null

  setupFrontend()

  parser = new Parser()
  solver = new Solver({
    queryInput: jq.queryInput
  })
  
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
  parser.onEnd = function (type, parsed, data) {
    jq.spinner.hide()
    util.hide(jq.notifications)

    if (type === 'source') {
      solver.setSource(parsed)
      return
    }

    if (type === 'query') {
      if (data && data.trace) {
        solver.callQuery(parsed, {
          trace: true
        })
        return
      }

      solver.callQuery(parsed)
      return
    }
  }

  solver.onStart = function () {
    jq.spinner.show()
    util.hide(jq.notifications)

    logEvent('Execution started')

    jq.queryButton.prop('disabled', 'disabled')
    jq.clearStore.prop('disabled', 'disabled')
    deactivateSource()
  }
  solver.onError = function (error) {
    $('#notification-query-error .mesg').text(error)
    jq.queryErrorNotification.show()
  }
  solver.onEnd = function (data) {
    logEvent('Execution finished')

    executionEnd(data)
  }
  solver.onBreakpoint = function (data) {
    if (!jq.switchTracing.bootstrapSwitch('state')) {
      solver.continueBreakpoint()
      return
    }

    if (duration === 0) {
      solver.continueBreakpoint()
      return
    }

    traceEvent(data)
  }
  solver.getOptions = function () {
    return {
      persistentStore: jq.switchPersistentStore.bootstrapSwitch('state')
    }
  }

  // initialize CodeMirror editor
  var codeMirror = CodeMirror.fromTextArea($('#source').get(0), {
    lineNumbers: true,
    theme: 'monokai',
    styleActiveLine: true,
    matchBrackets: true
  // , mode: 'chr'
  })

  $('.CodeMirror, #source-control').click(function () {
    // prevent calling the $('#source-col').click() event handler
    return false
  })

  // focus editor if source column clicked
  $('#source-col').click(function () {
    codeMirror.setCursor(codeMirror.lineCount(), 0)
    codeMirror.focus()
  })

  var editor = new Editor(codeMirror)
  editor.onChange = function (source, opts) {
    opts = opts || {}
    opts.forced = opts.forced || false

    if (!jq.switchAutocompilation.bootstrapSwitch('state') && !opts.forced) {
      // no autocompilation

      return
    }

    // give new source to parser
    parser.parse('source', source)
  }

  jq.compileButton.click(function () {
    editor.build({ forced: true })
  })

  jq.queryButton.click(function () {
    var query = jq.queryInput.val()

    if (jq.switchTracing.bootstrapSwitch('state')) {
      // tracing activated
      jq.traceLogPanel.empty()

      $('#tracer-play').show().prop('disabled', false)
      $('#tracer-pause').hide().prop('disabled', 'disabled')
      $('#tracer-continue').prop('disabled', false)
      $('#tracer-end').prop('disabled', false)
      $('#tracer-abort').prop('disabled', false)

      parser.parse('query', query, {
        trace: true
      })
    } else {
      parser.parse('query', query)
    }
  })
  jq.queryInput.keypress(function (e) {
    if (e.which === 13) {
      jq.queryButton.click()
    }
  })

  $('#notifications > div button.close').click(function (e) {
    $(this).parent().fadeOut()
  })

  jq.clearStore.click(function (e) {
    clearStore()
  })

  // focus editor once everything is loaded
  codeMirror.focus()

  loadGist()

  function executionEnd (data) {
    jq.queryInput.val('')
    jq.spinner.hide()

    jq.queryButton.prop('disabled', false)
    jq.clearStore.prop('disabled', false)
    reactivateSource()

    disableTracerControl()

    if (data && data.store) {
      updateStoreView(data.store)
    }

    if (duration === 0) {
      duration = null
    }
  }

  function updateStoreView (store) {
    // clear table
    jq.store.empty()

    if (store.length === 0) {
      jq.store.append('<tr><td></td><td>(empty)</td></tr>')
      jq.clearStore.hide()
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

  function disableTracerControl () {
    $('#tracer-play').show().prop('disabled', 'disabled')
    $('#tracer-pause').hide().prop('disabled', 'disabled')
    $('#tracer-continue').prop('disabled', 'disabled')
    $('#tracer-end').prop('disabled', 'disabled')
    $('#tracer-abort').prop('disabled', 'disabled')
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

  function loadGist () {
    var gistId = getParameterByName('gist')
    if (gistId) {
      jq.spinner.show()
      var gist = new Gister({
        isAnonymous: true
      })
      gist.on('error', function (err) {
        jq.spinner.hide()
        jq.gistErrorNotification.find('.mesg').text(err.toString())
      })
      gist.on('gist', function (data) {
        jq.spinner.hide()
        if (!data.files || !data.files['chrjs.chr']) {
          jq.gistErrorNotification.find('.mesg').text('Given Gist has no CHR code.')
          return
        }

        editor.setValue(data.files['chrjs.chr'].content)
      })
      gist.get(gistId)
    }
  }

  function setupFrontend () {
    jq.compileButton.hide()

    $('[data-type="switch"]').bootstrapSwitch()
    jq.switchAutocompilation.on('switchChange.bootstrapSwitch', function (event, state) {
      if (state) {
        jq.compileButton.fadeOut()

        editor.build({ forced: true })
      } else {
        jq.compileButton.fadeIn()

        jq.parsingErrorNotification.fadeOut()
      }
    })

    jq.switchTracing.on('switchChange.bootstrapSwitch', function (event, state) {
      if (state) {
        jq.traceLog.slideDown()
      } else {
        jq.traceLog.slideUp()
      }
    })

    jq.gistSave.click(function () {
      saveGist({
        public: true
      })
    })

    jq.tracerSettingsOptions.on('click', function (event) {
      var $target = $(event.currentTarget)
      var val = $target.attr('data-value')
      var $inp = $target.find('input')
      var idx

      if ((idx = tracerOptions.indexOf(val)) > -1) {
        tracerOptions.splice(idx, 1)
        setTimeout(function() {
          $inp.prop('checked', false)
        }, 0)
      } else {
        tracerOptions.push(val)
        setTimeout(function() {
          $inp.prop('checked', true)
        }, 0)
      }

      $(event.target).blur()
      return false
    })

    jq.tracerSettings.find('a:has(input[type="text"])').on('click', function (event) {
      var $target = $(event.currentTarget)
      var $inp = $target.find('input')
      $inp.focus()
      $(event.target).blur()
      return false
    })

    jq.tracerSettings.on('click', function (event) {
      return false
    })

    $('#tracer-play').click(function () {
      marker.clear()
      $('#tracer-play').hide().prop('disabled', 'disabled')
      $('#tracer-pause').show().prop('disabled', false)
      solver.continueBreakpoint()
    })

    $('#tracer-pause').click(function () {
      $('#tracer-play').show().prop('disabled', false)
      $('#tracer-pause').hide().prop('disabled', 'disabled')
      $('#tracer-continue').prop('disabled', false)
      $('#tracer-end').prop('disabled', false)
      $('#tracer-abort').prop('disabled', false)

      if (duration === 0) {
        duration = null

        solver.getStore(function (store) {
          updateStoreView(store)
        })
      }

      if (nextStepTimer) {
        clearTimeout(nextStepTimer)
      }
    })

    $('#tracer-continue').click(function () {
      marker.clear()
      solver.continueBreakpoint()
    })

    $('#tracer-end').click(function () {
      marker.clear()

      disableTracerControl()
      $('#tracer-play').hide()
      $('#tracer-pause').show().prop('disabled', false)

      duration = 0
      solver.continueBreakpoint()
    })

    $('#tracer-abort').click(function () {
      marker.clear()
      logEvent('Execution aborted.')
      executionEnd()
    })
  }

  function saveGist (opts) {
    opts = opts || {}

    var gist = new Gister({
      isAnonymous: true
    })

    gist.on('created', function (data) {
      jq.spinner.hide()
      var url = updateQueryString('gist', data.id)

      window.history.replaceState({}, 'Gist: ' + data.id, url)
    })
    gist.on('error', function (err) {
      jq.spinner.hide()
      jq.gistErrorNotification.find('.mesg').text(err.toString())
    })
    gist.create({
      'chrjs.chr': codeMirror.getValue()
    })
  }

  function traceEvent (data) {
    marker = editor.highlight(data)
    jq.spinner.hide()

    if (data && data.store) {
      updateStoreView(data.store)
    }

    logEvent(data)

    if ($('#tracer-pause').is(':visible')) {
      // autoplay
      var sleep = parseInt(jq.tracerSpeed.val()) * 1000
      sleep = Math.max(0, sleep)

      nextStepTimer = setTimeout(function () {
        marker.clear()
        jq.spinner.show()
        solver.continueBreakpoint()
      }, sleep)
    }
  }

  function logEvent (data) {
    var msg = ''
    if (typeof data === 'string') {
      msg = data
    } else if (data.event === 'rule:try') {
      msg = 'Try rule "' + data.rule + '" for ' + data.constraint
    } else if (data.event === 'rule:try-occurence') {
      msg = 'Try occurence ' + data.occurence + ' for ' + data.constraint
    }

    var el = '<p><code>[' + getTime() + '] ' + msg + '</code></p>'
    jq.traceLogPanel.append(el)

    // scroll to end
    jq.traceLogPanel.animate({
      scrollTop: jq.traceLogPanel.prop('scrollHeight') 
    }, 600)
  }

  function deactivateSource () {
    editor.deactivate()
    jq.compileButton.prop('disabled', 'disabled')
    jq.switchAutocompilation.bootstrapSwitch('disabled', true)
    jq.switchPersistentStore.bootstrapSwitch('disabled', true)
    jq.switchTracing.bootstrapSwitch('disabled', true)
  }

  function reactivateSource () {
    editor.reactivate()
    jq.compileButton.prop('disabled', false)
    jq.switchAutocompilation.bootstrapSwitch('disabled', false)
    jq.switchPersistentStore.bootstrapSwitch('disabled', false)
    jq.switchTracing.bootstrapSwitch('disabled', false)
  }
})

// acc. to http://stackoverflow.com/a/11654596
function updateQueryString (key, value, url) {
  if (!url) {
    url = window.location.href
  }
  var re = new RegExp('([?&])' + key + '=.*?(&|#|$)(.*)', 'gi')
  var hash

  if (re.test(url)) {
    if (typeof value !== 'undefined' && value !== null) {
      return url.replace(re, '$1' + key + '=' + value + '$2$3')
    } else {
      hash = url.split('#')
      url = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '')
      if (typeof hash[1] !== 'undefined' && hash[1] !== null) {
        url += '#' + hash[1]
      }
      return url
    }
  } else {
    if (typeof value !== 'undefined' && value !== null) {
      var separator = url.indexOf('?') !== -1 ? '&' : '?'
      hash = url.split('#')
      url = hash[0] + separator + key + '=' + value
      if (typeof hash[1] !== 'undefined' && hash[1] !== null) {
        url += '#' + hash[1]
      }
      return url
    } else {
      return url
    }
  }
}

function getParameterByName (name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]')
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)')
  var results = regex.exec(window.location.search)
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '))
}

function getTime () {
  var time = new Date()
  return ('0' + time.getHours()).slice(-2) + ':' + ('0' + time.getMinutes()).slice(-2) + ':' + ('0' + time.getSeconds()).slice(-2)
}

},{"./editor":1,"./parser":3,"./solver":4,"./util":5}],3:[function(require,module,exports){
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
  this.onBreakpoint = function () {}

  this.getOptions = function () {
    return {}
  }

  opts = opts || {}
  opts.queryInput = opts.queryInput || null

  var plugin = new jailed.Plugin(CHRWORKER_URI, {
    setInfo: setInfo,
    queryFinished: queryFinished,
    breakpoint: breakpoint
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

  function breakpoint (data) {
    self.onBreakpoint(data)
  }
}

Solver.prototype.setSource = function (parsed) {
  var opts = this.getOptions() || {}

  this.plugin.remote.setSource(parsed, opts)
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
