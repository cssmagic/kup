import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { KupError } from '../../lib/error.js'
import { buildPostIssuePayload, buildUpdateIssuePayload, postIssue, writeIssueMeta } from '../../lib/sync.js'

const tempDirs = []

afterEach(async () => {
	await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
})

describe('sync payload builders', () => {
	it('builds an update payload without clearing absent fields', () => {
		expect(buildUpdateIssuePayload({
			meta: {},
			title: '',
			content: 'Body only',
		})).toEqual({
			body: 'Body only',
		})
	})

	it('builds a post payload using meta title and labels when present', () => {
		expect(buildPostIssuePayload({
			meta: {
				title: 'Title from meta',
				tags: ['Doc'],
			},
			title: 'Ignored title',
			content: 'Body only',
		})).toEqual({
			title: 'Title from meta',
			body: 'Body only',
			labels: ['Doc'],
		})
	})
})

describe('postIssue()', () => {
	it('throws a KupError when the user aborts before posting', async () => {
		const inquirer = await import('inquirer')
		vi.spyOn(inquirer.default, 'prompt').mockResolvedValue({ postNewIssue: false })

		await expect(postIssue({
			meta: {},
			title: 'Title',
			content: 'Body',
		}, 'cssmagic/kup')).rejects.toMatchObject({
			name: 'KupError',
			outputLines: [
				{ method: 'log', text: '[Kup] Aborted!' },
			],
		})
	})
})

describe('writeIssueMeta()', () => {
	it('writes the updated metadata back to the markdown file', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-sync-test-'))
		tempDirs.push(tempDir)
		const filename = path.join(tempDir, 'note.md')
		await fs.writeFile(filename, [
			'---',
			'tags: []',
			'---',
			'',
			'# Title',
		].join('\n'), 'utf8')

		await writeIssueMeta(filename, {
			id: 21,
			repo: 'cssmagic/kup',
			shouldWriteRepo: true,
		})

		await expect(fs.readFile(filename, 'utf8')).resolves.toBe([
			'---',
			'repo: cssmagic/kup',
			'id: 21',
			'tags: []',
			'---',
			'',
			'# Title',
		].join('\n'))
	})
})
