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
    timeoutErrorNotification: $('#notification-timeout-error'),
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
    }
  }

  var solverTimer
  solver.onStart = function () {
    jq.spinner.show()
    util.hide(jq.notifications)

    solverTimer = new ExecutionTimer()
    solverTimer.onExceed = solverTimerExceeded
    solverTimer.start()

    logEvent('Execution started')

    jq.queryButton.prop('disabled', 'disabled')
    jq.clearStore.prop('disabled', 'disabled')
    deactivateSource()
  }
  solver.onError = function (error) {
    solverTimer.stop()
    $('#notification-query-error .mesg').text(error)
    jq.queryErrorNotification.show()
  }
  solver.onEnd = function (data) {
    solverTimer.stop()
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
  solver.onStoreEvent = function (data) {
    if (!jq.switchTracing.bootstrapSwitch('state')) {
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

      enableTracerControl()

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

  function solverTimerExceeded () {
    if (jq.switchTracing.bootstrapSwitch('state')) {
      return
    }

    jq.timeoutErrorNotification.find('.mesg').text('The solver uses more time to terminate than normal. Do you want to trace the program?')
    util.show(jq.timeoutErrorNotification)

    jq.spinner.hide()
    jq.switchTracing.bootstrapSwitch('disabled', false)
    jq.switchTracing.bootstrapSwitch('state', true)
    jq.switchTracing.bootstrapSwitch('disabled', true)
    enableTracerControl()
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

  function enableTracerControl () {
    $('#tracer-play').show().prop('disabled', false)
    $('#tracer-pause').hide().prop('disabled', 'disabled')
    $('#tracer-continue').prop('disabled', false)
    $('#tracer-end').prop('disabled', false)
    $('#tracer-abort').prop('disabled', false)
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
        setTimeout(function () {
          $inp.prop('checked', false)
        }, 0)
      } else {
        tracerOptions.push(val)
        setTimeout(function () {
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
      util.hide(jq.notifications)
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
    if (data.event && (data.event === 'store:add' || data.event === 'store:remove')) {
      if ($('input[data-event="' + data.event + '"]').is(':checked')) {
        logEvent(data)
      }
      return
    }

    marker = editor.highlight(data)
    jq.spinner.hide()

    if (data && data.store) {
      updateStoreView(data.store)
    }

    if (data && data.event && !$('input[data-event="' + data.event + '"]').is(':checked')) {
      marker.clear()
      jq.spinner.show()
      solver.continueBreakpoint()
      return
    }

    logEvent(data)

    if ($('#tracer-pause').is(':visible')) {
      // autoplay
      var sleep = parseInt(jq.tracerSpeed.val(), 10) * 1000
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
    } else if (data.event === 'rule:try-occurrence') {
      msg = 'Try occurrence ' + data.occurrence + ' for ' + data.constraint
    } else if (data.event === 'store:add') {
      msg = 'Added constraint ' + data.constraintString + ' to the store'
    } else if (data.event === 'store:remove') {
      msg = 'Removed constraint ' + data.constraintString + ' from the store'
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
  name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]')
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)')
  var results = regex.exec(window.location.search)
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '))
}

function getTime () {
  var time = new Date()
  return ('0' + time.getHours()).slice(-2) + ':' + ('0' + time.getMinutes()).slice(-2) + ':' + ('0' + time.getSeconds()).slice(-2)
}

function ExecutionTimer () {
  this.startDate = new Date()
  this.endDate = null
  this.maxExecutionTime = ExecutionTimer.MAXEXECUTIONTIME
  this.timer = null
  this.onExceed = function () {}
}

/**
 * Maximum amount of milliseconds to wait before call the
 *   timeExceeded error.
 * @type {Number}
 */
ExecutionTimer.MAXEXECUTIONTIME = 3000

ExecutionTimer.prototype.start = function startExecutionTimer (startDate) {
  var self = this

  this.startDate = startDate || new Date()
  this.timer = setTimeout(function () {
    self.exceed()
  }, this.maxExecutionTime)
}

ExecutionTimer.prototype.stop = function stopExecutionTimer (stopDate) {
  this.stopDate = stopDate || new Date()

  this.clearTimer()
}

ExecutionTimer.prototype.clearTimer = function clearExecutionTimer () {
  if (this.timer) {
    clearTimeout(this.timer)
    this.timer = null
  }
}

ExecutionTimer.prototype.exceed = function timeExceeded () {
  this.onExceed()

  this.clearTimer()
}
