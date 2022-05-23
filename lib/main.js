'use strict'

const { readTextFile } = require('./file')
const { parse } = require('./parse')

async function main(argv) {
	const {
		id = 0,
		repo = '',
		_: files,
	} = argv

	// 目前只处理第一个文件
	const file = files[0]
	let content = ''
	try {
		content = await readTextFile(file)
	} catch (e) {
		console.error(`[Kup] [Error] Cannot read file "${ file }"!`)
		console.error(e.message)
		process.exit(1)
	}

	const data = parse(content)
	console.log(data)

}

module.exports = {
	main,
}
