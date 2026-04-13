import { describe, expect, it } from 'vitest'

import { parse } from '../../lib/parse.js'

describe('parse()', () => {
	it('returns an empty structure for an empty file', () => {
		expect(parse('')).toEqual({
			meta: {},
			title: '',
			content: '',
		})
	})

	it('returns an empty structure for a whitespace-only file', () => {
		expect(parse('\n\n  \n')).toEqual({
			meta: {},
			title: '',
			content: '',
		})
	})

	it('parses front matter and keeps the h1 in content when meta.title exists', () => {
		const input = [
			'---',
			'repo: foo/bar',
			'id: 12',
			'tags: Demo',
			'title: Title from meta',
			'---',
			'',
			'# Heading in body',
			'',
			'Body line',
		].join('\n')

		expect(parse(input)).toEqual({
			meta: {
				repo: 'foo/bar',
				id: 12,
				tags: ['Demo'],
				title: 'Title from meta',
			},
			title: 'Heading in body',
			content: '# Heading in body\n\nBody line',
		})
	})

	it('falls back to the first h1 and removes it from content when meta.title is absent', () => {
		const input = '\n# Heading from body\n\nBody line\n'

		expect(parse(input)).toEqual({
			meta: {},
			title: 'Heading from body',
			content: 'Body line\n',
		})
	})

	it('supports the alternate YAML terminator', () => {
		const input = [
			'---',
			'repo: foo/bar',
			'...',
			'',
			'# Title',
			'',
			'Body',
		].join('\n')

		expect(parse(input)).toEqual({
			meta: {
				repo: 'foo/bar',
			},
			title: 'Title',
			content: 'Body',
		})
	})

	it('throws a KupError for invalid YAML front matter', () => {
		const input = [
			'---',
			'tags: [a,',
			'---',
			'',
			'# Title',
		].join('\n')

		expect(() => parse(input)).toThrowError('[Kup] [Error] Cannot parse YAML meta section:')
	})
})
