const SEPARATOR = '---'
const SEPARATOR_END_ALT = '...'

function updateIssueMeta(content, {
	id,
	repo = '',
	shouldWriteRepo = false,
} = {}) {
	const eol = detectEol(content)
	const lines = content.split(eol)
	const metaSection = detectMetaSection(lines)

	if (!metaSection) {
		return insertNewMetaSection(lines, {
			eol,
			id,
			repo,
			shouldWriteRepo,
		})
	}

	const metaLines = lines.slice(metaSection.start + 1, metaSection.end)
	upsertMetaLine(metaLines, 'repo', repo, shouldWriteRepo, ['id', 'tags', 'title'])
	upsertMetaLine(metaLines, 'id', String(id), true, ['tags', 'title'], ['repo'])

	return [
		...lines.slice(0, metaSection.start + 1),
		...metaLines,
		...lines.slice(metaSection.end),
	].join(eol)
}

function detectEol(content) {
	return content.includes('\r\n') ? '\r\n' : '\n'
}

function detectMetaSection(lines) {
	let start = 0
	while (start < lines.length && !lines[start].trim()) {
		start++
	}

	const firstLine = lines[start]
	const secondLine = lines[start + 1]
	if (!firstLine || !secondLine) return null

	const hasSeparatorStart = firstLine.trimEnd() === SEPARATOR
	const noEmptyLineAfterSeparatorStart = !!secondLine.trimEnd()
	const hasYamlKey = /^#?\s*[\w\-]+:/.test(secondLine.trim())
	if (!(hasSeparatorStart && noEmptyLineAfterSeparatorStart && hasYamlKey)) {
		return null
	}

	for (let i = start + 1; i < lines.length; i++) {
		const line = lines[i].trimEnd()
		if (line === SEPARATOR || line === SEPARATOR_END_ALT) {
			return { start, end: i }
		}
		if (!line) break
	}

	return null
}

function insertNewMetaSection(lines, { eol, id, repo, shouldWriteRepo }) {
	let insertAt = 0
	while (insertAt < lines.length && !lines[insertAt].trim()) {
		insertAt++
	}

	const metaLines = [SEPARATOR]
	if (shouldWriteRepo) metaLines.push(`repo: ${ repo }`)
	metaLines.push(`id: ${ id }`)
	metaLines.push(SEPARATOR)

	const result = [
		...lines.slice(0, insertAt),
		...metaLines,
	]
	const bodyLines = lines.slice(insertAt)
	if (bodyLines.length) {
		result.push('')
		result.push(...bodyLines)
	}

	return result.join(eol)
}

function upsertMetaLine(metaLines, key, value, shouldWrite, beforeKeys = [], afterKeys = []) {
	if (!shouldWrite) return

	const existingIndex = findMetaLineIndex(metaLines, key)
	if (existingIndex >= 0) {
		metaLines[existingIndex] = replaceMetaLineValue(metaLines[existingIndex], key, value)
		return
	}

	const insertIndex = findInsertIndex(metaLines, beforeKeys, afterKeys)
	metaLines.splice(insertIndex, 0, `${ key }: ${ value }`)
}

function findMetaLineIndex(metaLines, key) {
	return metaLines.findIndex((line) => {
		const match = /^(\s*)([\w\-]+)(\s*:.*)$/.exec(line)
		return match?.[2] === key
	})
}

function replaceMetaLineValue(line, key, value) {
	const match = new RegExp(`^(\\s*${ key }\\s*:)(\\s*)(.*?)(\\s+#.*)?$`).exec(line)
	if (!match) return `${ key }: ${ value }`

	const [, prefix, , , comment = ''] = match
	return `${ prefix } ${ value }${ comment }`
}

function findInsertIndex(metaLines, beforeKeys, afterKeys) {
	for (const key of beforeKeys) {
		const index = findMetaLineIndex(metaLines, key)
		if (index >= 0) return index
	}

	let afterIndex = -1
	for (const key of afterKeys) {
		const index = findMetaLineIndex(metaLines, key)
		if (index > afterIndex) afterIndex = index
	}

	return afterIndex >= 0 ? afterIndex + 1 : metaLines.length
}

export {
	updateIssueMeta,
}
