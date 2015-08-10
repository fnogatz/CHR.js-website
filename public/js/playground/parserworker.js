/* global self, chrparser */

self.importScripts('parser.js')

var parse = chrparser.parse

self.addEventListener('message', function (obj) {
  var type = obj.data.type
  var source = obj.data.source

  var startRule = ''
  if (type === 'source') {
    startRule = 'ProgramWithPreamble'
  } else if (type === 'query') {
    startRule = 'Query'
  }

  var parsed
  try {
    parsed = parse(source, {
      startRule: startRule
    })
  } catch (err) {
    self.postMessage({
      type: type,
      error: err.message
    })
    return
  }

  self.postMessage({
    type: type,
    parsed: parsed
  })

  return
})

self.postMessage('ready')
