(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode('chr', function (config) {
  var jsMode = CodeMirror.getMode(config, 'javascript')

  return {
    startState: function () {
      return {
        localState: null,
        curlyBraced: 0,
        braced: 0,
        current: 'preamble',
        inParametersList: false
      }
    },
    token: function (stream, state) {
      if (state.braced || state.inParametersList) {
        if (state.localState === null) {
          state.localState = jsMode.startState()
        }
        var token = jsMode.token(stream, state.localState)
        var text = stream.current()
        if (!token) {
          for (var i = 0; i < text.length; i++) {
            if (text[i] === '(') {
              state.braced++
            } else if (text[i] === ')') {
              state.braced--
            }
          }
        }

        if (state.braced === 0) {
          state.inParametersList = false
        }

        return token
      } else if (state.curlyBraced || (state.current === 'preamble' && stream.peek() === '{') || (state.current === 'ruleBody' && stream.match(/^\${/))) {
        if (state.localState === null) {
          state.localState = jsMode.startState()
        }
        var token = jsMode.token(stream, state.localState)
        var text = stream.current()
        if (!token) {
          for (var i = 0; i < text.length; i++) {
            if (text[i] === '{') {
              state.curlyBraced++
            } else if (text[i] === '}') {
              state.curlyBraced--
            }
          }
        }

        if (state.current === 'preamble') {
          state.current = 'ruleStart'
        }

        return token
      } else if ((state.current === 'preamble' || state.current === 'ruleStart') && stream.match(/^[a-zA-Z0-9\s_]+\s?@/)) {
        state.current = 'ruleHead'
        return 'comment'
      } else if ((state.current === 'ruleHead' || state.current === 'ruleBody' || ((state.current === 'preamble' || state.current === 'ruleStart') && !stream.match(/^[a-zA-Z0-9\s_]+\s?@/))) && stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*\(/, false)) {
        stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)
        if (state.current === 'preamble' || state.current === 'ruleStart') {
          state.current = 'ruleHead'
        }
        state.inParametersList = true
        return 'property'
      } else if ((state.current === 'ruleHead' || state.current === 'ruleBody' || ((state.current === 'preamble' || state.current === 'ruleStart') && !stream.match(/^[a-zA-Z0-9\s_]+\s?@/))) && stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
        if (state.current === 'preamble' || state.current === 'ruleStart') {
          state.current = 'ruleHead'
        }
        return 'property'
      } else if (state.current === 'ruleHead' && stream.match(/^(==>|<=>).*\|/, false)) {
        stream.match(/^(==>|<=>)/)
        state.current = 'ruleGuard'
        return 'keyword'
      } else if (state.current === 'ruleHead' && stream.match(/^(==>|<=>)/)) {
        state.current = 'ruleBody'
        return 'keyword'
      } else if (state.current === 'ruleGuard' && stream.match(/^\|/)) {
        state.current = 'ruleBody'
        return 'keyword'
      } else {
        stream.next()
      }

      return null
    }
  }
})
});
