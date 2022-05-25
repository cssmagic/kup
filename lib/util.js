'use strict'

// 考虑到输入源的类型有限，这里只是做了一个简化的实现
function isPlainObject(obj) {
	if (!obj) return false
	if (typeof obj !== 'object') return false
	if (Array.isArray(obj)) return false
	return true
}


// run this line in shell to active debug mode:
// `export KUP_DEBUG_MODE=1`
function isDebugging() {
	return !!Number(process.env.KUP_DEBUG_MODE)
}

module.exports = {
	isPlainObject,
	isDebugging,
}
