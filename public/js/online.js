var DELAY_BUILD = 500
var DELAY_STORE_UPDATE = 500

var editor
var oldSource = null
var timer = {
  build: null,
  storeUpdate: null
}
var compiled = null // generated JavaScript code
var persistent = {
  Store: null,
  History: null
}

$(document).ready(function() {
  $('#spinner').hide()

  persistent.Store = new chrjs.Runtime.Store()
  persistent.History = new chrjs.Runtime.History()
  persistent.Store.on('add', scheduleStoreUpdate)
  persistent.Store.on('delete', scheduleStoreUpdate)

  $('#source').text($('#examples pre[data-example-id="gcd"]').text())

  // initialize CodeMirrot editor
  editor = CodeMirror.fromTextArea($("#source").get(0), {
    lineNumbers: true
  })

  // trigger cursor or selection moves or any change is made
  editor.on('cursorActivity', scheduleBuild)
  editor.on('focus', scheduleBuild)
  editor.on('keydown', scheduleBuild)
  editor.on('keypress', scheduleBuild)
  editor.on('keyup', scheduleBuild)
  editor.on('mousedown', scheduleBuild)
  editor.on('mouseup', scheduleBuild)

  $('#addConstraint button').click(addConstraintFromForm)
  $('#addConstraint input').keypress(function (e) {
    if (e.which == 13) {
      addConstraintFromForm()
      return false
    }
  });

  $('#examples a').click(function (e) {
    var pre = $(this).find('pre')
    editor.setValue(pre.text())
    build()
  })

  $('#clearStore').click(function (e) {
    clearStore()
  })

  $('#download-links a').click(function (e) {
    downloadSource.apply(this, e)
  })
})

function scheduleBuild() {
  var nothingChanged = getSource() === oldSource
  if (nothingChanged) { return }

  if (timer.build !== null) {
    clearTimeout(timer.build)
    timer.build = null
  }
  /*if (parseTimer !== null) {
    clearTimeout(parseTimer)
    parseTimer = null
  }*/

  timer.build = setTimeout(function() {
    build()
    timer.build = null
  }, DELAY_BUILD)
}

function scheduleStoreUpdate() {
  if (timer.storeUpdate !== null) {
    clearTimeout(timer.storeUpdate)
    timer.storeUpdate = null
  }

  timer.storeUpdate = setTimeout(function() {
    updateStore()
    timer.storeUpdate = null
  }, DELAY_STORE_UPDATE)
}

function build() {
  oldSource = getSource()

  var newSource

  // compile CHR
  try {
    newSource = chrjs.compile(oldSource, { withoutExport: true })
  } catch (e) {
    console.log('Error while compiling source:', e)
    $('#sourceAlert').text('Couldn\'t compile source: '+e)
    $('#sourceAlert').show()
    return
  }

  // load generated code
  try {
    eval(newSource+'\n'+'window.CHR = new CHR(persistent.Store, persistent.History);')
  } catch (e) {
    $('#sourceAlert').text('Couldn\'t load generated code: '+e)
    $('#sourceAlert').show()
    console.log('Error while loading generated code:', e)
  }

  $('#sourceAlert').hide()

  compiled = newSource
}

function getSource() {
  return editor.getValue()
}

function updateStore() {
  // visualize updated CHR Store
  printStore()
}

function printStore() {
  var store = $('#store tbody')

  // clear table
  store.empty()

  if (CHR.Store.length === 0) {
    store.append('<tr><td></td><td>(empty)</td></tr>')
    $('#clearStore').hide()
    return
  }

  // add rows
  CHR.Store.forEach(function addConstraintRow(constraint, id) {
    var html = '<tr data-constraint-id="'+constraint.id+'"><td>'+constraint.id+'</td><td><code>'+constraint.toString()+'</code>'
    html += '<button type="button" title="Remove" class="close remove-constraint" data-constraint-id="'+constraint.id+'">×</button>'
    //html += '<button type="button" title="Reactivate" class="close reactivate-constraint" data-constraint-id="'+constraint.id+'">✓</button>'
    html += '</td></tr>'
    store.append(html)

    store.find('button.remove-constraint').on('click', removeConstraint)
    store.find('button.reactivate-constraint').on('click', reactivateConstraint)
  })

  $('#clearStore').show()
}

function reactivateConstraint() {

}

function removeConstraint(id) {
  var constraintId
  if (typeof id === 'string') {
    constraintId = id
  } else {
    constraintId = $(this).data('constraintId')
  }
  CHR.Store.kill(constraintId)

  $('#store tbody tr[data-constraint-id="'+constraintId+'"]').remove()
  if (CHR.Store.length === 0) {
    $('#store tbody').append('<tr><td></td><td>(empty)</td></tr>')
    $('#clearStore').hide()
  }
}

function addConstraintFromForm() {
  var input = $('#addConstraint input').val()
  var constraint = /\)$/.test(input) ? input : input+'()'

  var functor = getFunctor(constraint)

  if (CHR.constraints.indexOf(functor) < 0) {
    $('#constraintAddAlert').text(functor+' is no valid constraint.')
    $('#constraintAddAlert').show()
    return
  }

  try {
    eval('CHR.'+constraint)
  } catch (e) {
    console.log('Error while adding constraint:', e)
    $('#constraintAddAlert').text('Error while adding the constraint: '+e)
    $('#constraintAddAlert').show()
    return
  }

  $('#constraintAddAlert').hide()
  $('#addConstraint input').val('')
}

function clearStore() {
  persistent.Store.forEach(function(c, id) {
    removeConstraint(id)
  })
}

function getFunctor(str) {
  if (/^[a-z][A-Za-z0-9]*$/.test(str)) {
    return str+'/0'
  }

  var name = str.replace(/^([a-z][A-Za-z0-9]*)\(.*$/, '$1')
  var args = str.replace(/^[a-z][A-Za-z0-9]*\((.*)\)$/, '$1')
  if (args === '') {
    return name+'/0'
  }

  var arity = args.split(',').length
  return name+'/'+arity
}

function downloadSource(e) {
  var format = $(this).data('downloadFormat')
  var src

  if (format === 'node') {
    src = [
      'var chrjs = { Runtime: require("chr/runtime") }',
      '',
      compiled,
      'module.exports = new CHR()'
    ].join('\n')
  }
  else if (format === 'browser') {
    src = [
      compiled,
      'window.CHR = new CHR()'
    ].join('\n')
  }

  download(src, 'chr.js', 'text/plain')
}
