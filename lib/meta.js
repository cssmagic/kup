import YAML from 'yaml'

const SEPARATOR = '---'
const SEPARATOR_END_ALT = '...'

function updateIssueMeta(content, {
	id,
	repo = '',
	shouldWriteRepo = false,
	tags,
	title,
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
			tags,
			title,
		})
	}

	const metaLines = lines.slice(metaSection.start + 1, metaSection.end)
	upsertMetaLine(metaLines, 'repo', repo, shouldWriteRepo, ['id', 'tags', 'title'])
	upsertMetaLine(metaLines, 'id', id, typeof id !== 'undefined', ['tags', 'title'], ['repo'])
	upsertMetaLine(metaLines, 'tags', tags, Array.isArray(tags) && tags.length > 0, ['title'], ['id', 'repo'])
	upsertMetaLine(metaLines, 'title', title, typeof title === 'string' && !!title, [], ['tags', 'id', 'repo'])

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

function insertNewMetaSection(lines, {
	eol,
	id,
	repo,
	tags,
	title,
	shouldWriteRepo,
}) {
	let insertAt = 0
	while (insertAt < lines.length && !lines[insertAt].trim()) {
		insertAt++
	}

	const metaLines = [
		SEPARATOR,
		...buildMetaFields({
			id,
			repo,
			tags,
			title,
			shouldWriteRepo,
		}),
		SEPARATOR,
	]

	const bodyLines = lines.slice(insertAt)
	const result = [...metaLines]
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
	metaLines.splice(insertIndex, 0, stringifyMetaField(key, value))
}

function findMetaLineIndex(metaLines, key) {
	return metaLines.findIndex((line) => {
		const match = /^(\s*)([\w\-]+)(\s*:.*)$/.exec(line)
		return match?.[2] === key
	})
}

function replaceMetaLineValue(line, key, value) {
	const match = new RegExp(`^(\\s*${ key }\\s*:)(\\s*)(.*?)(\\s+#.*)?$`).exec(line)
	if (!match) return stringifyMetaField(key, value)

	const [, prefix, , , comment = ''] = match
	return `${ prefix } ${ stringifyMetaValue(value, { flow: Array.isArray(value) }) }${ comment }`
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

function buildIssueMarkdown({
	body = '',
	id,
	repo = '',
	tags,
	title,
	shouldWriteRepo = false,
} = {}) {
	const metaLines = [
		SEPARATOR,
		...buildMetaFields({
			id,
			repo,
			tags,
			title,
			shouldWriteRepo,
		}),
		SEPARATOR,
	]

	return `${ metaLines.join('\n') }\n\n${ body || '' }`
}

function buildMetaFields({
	id,
	repo = '',
	tags,
	title,
	shouldWriteRepo = false,
} = {}) {
	const fields = []
	if (shouldWriteRepo) fields.push(stringifyMetaField('repo', repo))
	if (typeof id !== 'undefined') fields.push(stringifyMetaField('id', id))
	if (Array.isArray(tags) && tags.length > 0) fields.push(stringifyMetaField('tags', tags))
	if (typeof title === 'string' && title) fields.push(stringifyMetaField('title', title))
	return fields
}

function stringifyMetaField(key, value) {
	return `${ key }: ${ stringifyMetaValue(value, { flow: Array.isArray(value) }) }`
}

function stringifyMetaValue(value, { flow = false } = {}) {
	const doc = new YAML.Document()
	doc.contents = doc.createNode({ value })
	const node = doc.get('value', true)
	if (flow && node) node.flow = true
	const output = doc.toString({
		directives: false,
		flowCollectionPadding: false,
	}).trim()
	return output.replace(/^value:\s*/, '')
}

export {
	buildIssueMarkdown,
	updateIssueMeta,
}
