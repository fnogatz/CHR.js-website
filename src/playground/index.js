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
    gistSave: $('#gist-save')
  }

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

    jq.gistSave.click(function () {
      saveGist({
        public: true
      })
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
