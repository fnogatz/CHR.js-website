module.exports = {}
module.exports.show = show
module.exports.hide = hide

function show (sel) {
  sel.removeClass('inactive')
}

function hide (sel) {
  sel.addClass('inactive')
}
