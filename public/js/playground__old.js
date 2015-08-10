var automaticBuild = true

;(function() {
  var DELAY_BUILD = 500
  
  var editor
  var oldSource

  var timer = {
    build: null,
    storeUpdate: null
  }

  var workers = {
    parser: null
  }

  $(document).ready(function() {
    // initialize CodeMirror editor
    editor = CodeMirror.fromTextArea($("#source").get(0), {
      lineNumbers: true,
      theme: 'monokai',
      styleActiveLine: true,
      matchBrackets: true,
      //mode: 'chr'
    })

    // focus editor if source column clicked
    $('#source-col').click(function() {
      editor.focus()
    })

    automaticBuilder()

    // focus editor once page is loaded
    editor.focus()
  })

  function automaticBuilder() {
    // trigger cursor or selection moves or any change is made
    editor.on('cursorActivity', scheduleBuild)
    editor.on('focus', scheduleBuild)
    editor.on('keydown', scheduleBuild)
    editor.on('keypress', scheduleBuild)
    editor.on('keyup', scheduleBuild)
    editor.on('mousedown', scheduleBuild)
    editor.on('mouseup', scheduleBuild)

    // trigger first build
    scheduleBuild()
  }

  function scheduleBuild() {
    var nothingChanged = getSource() === oldSource
    if (nothingChanged) { return }

    if (timer.build !== null) {
      clearTimeout(timer.build)
      timer.build = null
    }

    timer.build = setTimeout(function() {
      build()
      timer.build = null
    }, DELAY_BUILD)
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
})()
