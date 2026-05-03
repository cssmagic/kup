// 考虑到输入源的类型有限，这里只是做了一个简化的实现
function isPlainObject(obj) {
	if (!obj) return false
	if (typeof obj !== 'object') return false
	if (Array.isArray(obj)) return false
	return true
}


let debugMode = false

function setDebugging(value) {
	debugMode = Boolean(value)
}

function isDebugging() {
	return debugMode
}

export {
	isPlainObject,
	isDebugging,
	setDebugging,
}
