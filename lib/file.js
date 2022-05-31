'use strict'
const fsPromises = require('fs').promises

function readTextFile(pathname) {
	return fsPromises.readFile(pathname)
		.then((bin) => {
			// 去除 utf-8 文本文件的 BOM
			if (bin[0] === 0xEF && bin[1] === 0xBB && bin[2] === 0xBF) {
				bin = bin.slice(3)
			}
			return bin.toString('utf-8')
		})
}

module.exports = {
	readTextFile,
}
