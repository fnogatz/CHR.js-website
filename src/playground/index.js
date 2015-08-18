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
    clearStore: $('#clearStore'),
    switchAutocompilation: $('input[name="cb-live-compilation"]'),
    switchPersistentStore: $('input[name="cb-persistent-store"]'),
    switchTracing: $('input[name="cb-tracing"]'),
    switchTraceAutoplay: $('input[name="cb-trace-autoplay"]'),
    sliderTraceSpeed: null,
    gistSave: $('#gist-save'),
    traceLog: $('#trace-log'),
    traceLogPanel: $('#trace-log .panel-body'),
    tracerContinue: $('#tracer-continue'),
    tracerContinueButton: $('#tracer-continue-button')
  }

  var sliderTraceSpeed
  var marker

  setupFrontend()

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
  parser.onEnd = function (type, parsed, data) {
    jq.spinner.hide()
    util.hide(jq.notifications)

    if (type === 'source') {
      solver.setSource(parsed)

      if (jq.switchTracing.bootstrapSwitch('state')) {
        solver.activateTrace
      }

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

  solver = new Solver({
    queryInput: jq.queryInput
  })
  solver.onStart = function () {
    jq.spinner.show()
    util.hide(jq.notifications)

    jq.queryButton.prop('disabled', 'disabled')
    deactivateSource()
  }
  solver.onError = function (error) {
    $('#notification-query-error .mesg').text(error)
    jq.queryErrorNotification.show()
  }
  solver.onEnd = function (data) {
    jq.queryInput.val('')
    jq.spinner.hide()

    jq.queryButton.prop('disabled', false)
    reactivateSource()

    if (data && data.store) {
      updateStoreView(data.store)
    }
  }
  solver.onBreakpoint = function (data) {
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

  $('#clearStore').click(function (e) {
    clearStore()
  })

  // focus editor once everything is loaded
  codeMirror.focus()

  loadGist()

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

    sliderTraceSpeed = $('#tracer-speed').slider({
      formatter: function (value) {
        return 'Pause per step: ' + value + 's'
      }
    })
    jq.sliderTraceSpeed = $('#tracer-adjust-speed')

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
        solver.activateTrace()
        jq.traceLog.slideDown()
      } else {
        jq.traceLog.slideUp()
        solver.deactivateTrace()
      }
    })
    jq.switchTraceAutoplay.on('switchChange.bootstrapSwitch', function (event, state) {
      if (state) {
        jq.tracerContinue.hide()
        jq.sliderTraceSpeed.show()
      } else {
        jq.sliderTraceSpeed.hide()
        jq.tracerContinue.show()
      }
    })

    jq.gistSave.click(function () {
      saveGist({
        public: true
      })
    })

    jq.tracerContinueButton.click(function () {
      jq.tracerContinueButton.hide()
      jq.spinner.show()
      if (marker && marker.clear) {
        marker.clear()
      }

      solver.continueBreakpoint()
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

    if (jq.switchTraceAutoplay.bootstrapSwitch('state')) {
      // autoplay
      var duration = sliderTraceSpeed.slider('getValue') * 1000

      setTimeout(function () {
        marker.clear()
        jq.spinner.show()
        solver.continueBreakpoint()
      }, duration)
    } else {
      jq.tracerContinueButton.show()
    }
  }

  function logEvent (data) {
    var msg = ''
    if (data.event === 'rule:try') {
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
  }

  function reactivateSource () {
    editor.reactivate()
    jq.compileButton.prop('disabled', false)
    jq.switchAutocompilation.bootstrapSwitch('disabled', false)
    jq.switchPersistentStore.bootstrapSwitch('disabled', false)
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
