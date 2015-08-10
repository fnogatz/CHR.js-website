/* global CHR, importScripts, application */

/**
 * Closure that holds the evaluated preamble
 *   and CHR handler.
 *
 * @param {Object} parsed  Object generated by CHR parser
 */
function CHRWorker (parsed) {
  // evaluate given preamble
  var preamble = parsed.preamble || ''
  eval(preamble) // eslint-disable-line no-eval

  // replacements must be evaluated in this context
  // to access the methods specified in the preamble
  var replacements = parsed.replacements.map(function (replacement) {
    return eval('(' + replacement.expr.original + ')') // eslint-disable-line no-eval
  })

  // compile given CHR source code
  var chr = new CHR()
  chr(parsed, replacements)

  application.remote.setInfo({
    functors: chr.Functors.sort(functorComparator)
  })

  function callQuery (queries) {
    queries.forEach(function (query) {
      var queryCall = 'chr.' + query.original
      if (query.arity === 0) {
        queryCall += '()'
      }

      try {
        eval(queryCall) // eslint-disable-line no-eval
      } catch (err) {
        if (err.name === 'TypeError' && /^chr\..* is not a function$/.test(err.message)) {
          application.remote.queryFinished({
            error: 'The constraint ' + query.name + '/' + query.arity + ' is undefined'
          })
          return
        }

        application.remote.queryFinished({
          error: err.toString()
        })

        return
      }
    })

    application.remote.queryFinished({
      store: chr.Store.map(function (constraint) {
        return {
          id: constraint.id,
          string: constraint.toString()
        }
      })
    })
  }

  function killConstraint (id) {
    chr.Store.kill(id)
  }

  // return access methods
  return {
    functors: chr.Functors,
    callQuery: callQuery,
    killConstraint: killConstraint,
    test: function () {
      console.log('Test called', arguments)
    }
  }
}

var worker

var api = {
  loadCHR: function (url) {
    // load CHR.js into variable `CHR` in plugin context
    importScripts(url)
  },
  setSource: function (parsed) {
    worker = CHRWorker(parsed)
  },
  callQuery: function (parsed) {
    worker.callQuery(parsed)
  },
  killConstraint: function (id) {
    worker.killConstraint(id)
  }
}

application.setInterface(api)

function functorComparator (a, b) {
  a = a.split('/')
  b = b.split('/')

  if (a[0] < b[0]) {
    return -1
  }
  if (a[0] > b[0]) {
    return 1
  }

  a = parseInt(a[1], 10)
  b = parseInt(b[1], 10)

  if (a < b) {
    return -1
  }
  if (a > b) {
    return 1
  }
  return 0
}