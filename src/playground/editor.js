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
