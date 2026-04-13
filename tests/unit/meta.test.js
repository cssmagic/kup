import { describe, expect, it } from 'vitest'

import { buildIssueMarkdown, updateIssueMeta } from '../../lib/meta.js'

describe('updateIssueMeta()', () => {
	it('overwrites an empty id field instead of inserting a duplicate one', () => {
		const input = [
			'---',
			'repo: cssmagic/kup',
			'id:',
			'tags: []',
			'---',
			'',
			'# Title',
		].join('\n')

		expect(updateIssueMeta(input, {
			id: 99,
			repo: 'cssmagic/kup',
			shouldWriteRepo: false,
		})).toBe([
			'---',
			'repo: cssmagic/kup',
			'id: 99',
			'tags: []',
			'---',
			'',
			'# Title',
		].join('\n'))
	})

	it('inserts repo before id, tags, and title when repo comes from CLI', () => {
		const input = [
			'---',
			'tags: []',
			'title: Demo',
			'---',
			'',
			'Body',
		].join('\n')

		expect(updateIssueMeta(input, {
			id: 12,
			repo: 'cssmagic/kup',
			shouldWriteRepo: true,
		})).toBe([
			'---',
			'repo: cssmagic/kup',
			'id: 12',
			'tags: []',
			'title: Demo',
			'---',
			'',
			'Body',
		].join('\n'))
	})

	it('creates a new front matter block when the file has none', () => {
		const input = '# Title\n\nBody\n'

		expect(updateIssueMeta(input, {
			id: 7,
			repo: 'cssmagic/kup',
			shouldWriteRepo: true,
		})).toBe([
			'---',
			'repo: cssmagic/kup',
			'id: 7',
			'---',
			'',
			'# Title',
			'',
			'Body',
			'',
		].join('\n'))
	})

	it('puts the new front matter on the first line even when the file starts with blank lines', () => {
		const input = '\n\n# Title\n\nBody\n'

		expect(updateIssueMeta(input, {
			id: 7,
			repo: 'cssmagic/kup',
			shouldWriteRepo: true,
		})).toBe([
			'---',
			'repo: cssmagic/kup',
			'id: 7',
			'---',
			'',
			'# Title',
			'',
			'Body',
			'',
		].join('\n'))
	})

	it('skips writing repo when it comes from package.json', () => {
		const input = [
			'---',
			'tags: []',
			'---',
			'',
			'Body',
		].join('\n')

		expect(updateIssueMeta(input, {
			id: 18,
			repo: 'cssmagic/kup',
			shouldWriteRepo: false,
		})).toBe([
			'---',
			'id: 18',
			'tags: []',
			'---',
			'',
			'Body',
		].join('\n'))
	})

	it('serializes tags as a single-line YAML array and quotes unsafe titles', () => {
		const input = [
			'---',
			'id: 18',
			'---',
			'',
			'Body',
		].join('\n')

		expect(updateIssueMeta(input, {
			id: 18,
			tags: ['help wanted', 'true'],
			title: 'a: b # c',
		})).toBe([
			'---',
			'id: 18',
			'tags: [help wanted, "true"]',
			'title: "a: b # c"',
			'---',
			'',
			'Body',
		].join('\n'))
	})
})

describe('buildIssueMarkdown()', () => {
	it('builds dumped issue content with ordered metadata', () => {
		expect(buildIssueMarkdown({
			id: 42,
			repo: 'cssmagic/kup',
			shouldWriteRepo: true,
			tags: ['bug', 'help wanted'],
			title: 'Demo title',
			body: 'Issue body',
		})).toBe([
			'---',
			'repo: cssmagic/kup',
			'id: 42',
			'tags: [bug, help wanted]',
			'title: Demo title',
			'---',
			'',
			'Issue body',
		].join('\n'))
	})
})
