'use strict'
function isPlainObject(obj) {
	if (!obj) return false
	if (typeof obj !== 'object') return false
	if (Array.isArray(obj)) return false
	return true
}

module.exports = {
	isPlainObject,
}
