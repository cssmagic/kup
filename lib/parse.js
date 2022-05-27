'use strict'
const YAML = require('yaml')

const { isPlainObject } = require('./util')

// parse markdown file:
// - extract metadata in yaml format
// - extract main title from h1

const SEPARATOR = '---'
const SEPARATOR_END_ALT = '...'
const LF = '\n'

function parse(text) {
	// trim leading LF
	const lines = text.trimStart().split(LF)

	// console.log(_detectMetaSectionLineQty(lines))
	const metaLineQty = _detectMetaSectionLineQty(lines)
	let meta = {}
	if (metaLineQty > 2) {
		meta = _parseMetaSection(lines, metaLineQty)
	}

	// 注意：这个函数会修改原数组
	_stripMetaSection(lines, metaLineQty)

	// 从正文中获取一级标题作为备用 title
	let title = _getTitleFromMainBody(lines[0])
	// 如果采用正文的一级标题作为最终 title，则从正文中去除一级标题，以免复重
	if (!meta.title && title) lines[0] = ''

	// console.log(lines)
	return {
		meta,
		title,
		content: lines.join(LF).trimStart(),
	}
}

function _detectMetaSectionLineQty(lines) {
	const hasSeparatorStart = lines[0].trimEnd() === SEPARATOR
	const noEmptyLineAfterSeparatorStart = !!lines[1].trimEnd()
	const hasYamlKey = /^#?\s*[\w\-]+:/.test(lines[1].trim())

	let metaLineQty = 0
	if (hasSeparatorStart && noEmptyLineAfterSeparatorStart && hasYamlKey) {
		// 从第二行 (i = 1) 开始扫描
		for (let i = 1; i < lines.length; i++) {
			let line = lines[i].trimEnd()
			// 遇到结束分隔符，则可以得出行数并退出
			if (line === SEPARATOR || line === SEPARATOR_END_ALT) {
				metaLineQty = i + 1
				break
			}
			// 在遇到结束分隔符之前遇到空行，则视为元数据不存在
			if (!line) break
		}
	}
	return metaLineQty
}

function _parseMetaSection(lines, metaLineQty) {
	// 把分隔符之间的 YAML 代码取出来
	const metaLines = lines.slice(1, metaLineQty - 1)
	const yaml = metaLines.join(LF)
	let result = {}
	try {
		result = YAML.parse(yaml)
	} catch (e) {
		console.error(`[Kup] [Error] Cannot parse YAML meta section:`)
		console.error(SEPARATOR)
		console.error(yaml)
		console.error(SEPARATOR)
		console.error(e.message)
		process.exit(1)
	}
	// console.log(result)
	if (!isPlainObject(result)) {
		console.error(`[Kup] [Error] YAML data must be an Object!`)
		process.exit(1)
	}

	// format
	const tags = result.tags
	if (!tags) {
		delete result.tags
	} else if (!Array.isArray(tags)) {
		result.tags = [String(tags)]
	}

	return result
}

// 注意：这个函数会修改原数组
function _stripMetaSection(lines, metaLineQty) {
	lines.splice(0, metaLineQty)

	// trim leading empty lines
	let emptyLineQty = 0
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i].trimEnd()
		if (line) {
			break
		} else {
			emptyLineQty++
		}
	}
	if (emptyLineQty) lines.splice(0, emptyLineQty)
}

function _getTitleFromMainBody(firstLine) {
	const re = /^#([^#].*)/
	const result = re.exec(firstLine.trim())
	const title = result ? result[1].trim() : ''
	return title
}

module.exports = {
	parse,
}
