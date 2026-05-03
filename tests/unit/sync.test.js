import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import inquirer from 'inquirer'

import { KupError } from '../../lib/error.js'
import { setDebugging } from '../../lib/util.js'
import {
	buildPostIssuePayload,
	buildProxyOptionsForGot,
	buildUpdateIssuePayload,
	confirmOverwriteDumpFile,
	confirmWriteIssueMeta,
	postIssue,
	writeIssueMeta,
} from '../../lib/sync.js'

const tempDirs = []

beforeEach(() => {
	setDebugging(false)
	delete process.env.https_proxy
	delete process.env.HTTPS_PROXY
})

afterEach(async () => {
	vi.restoreAllMocks()
	setDebugging(false)
	delete process.env.https_proxy
	delete process.env.HTTPS_PROXY
	await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
})

describe('buildProxyOptionsForGot()', () => {
	it('returns empty options without a proxy setting', () => {
		expect(buildProxyOptionsForGot()).toEqual({})
	})

	it('uses https_proxy for HTTPS requests in normal mode', () => {
		process.env.https_proxy = 'http://127.0.0.1:7890'

		const options = buildProxyOptionsForGot()

		expect(options.agent.https.proxy.href).toBe('http://127.0.0.1:7890/')
		expect(options.https).toBeUndefined()
	})

	it('falls back to HTTPS_PROXY when https_proxy is absent', () => {
		process.env.HTTPS_PROXY = 'http://127.0.0.1:7891'

		const options = buildProxyOptionsForGot()

		expect(options.agent.https.proxy.href).toBe('http://127.0.0.1:7891/')
	})

	it('uses the Charles proxy and relaxes TLS verification in debug mode', () => {
		process.env.https_proxy = 'http://127.0.0.1:7890'
		setDebugging(true)

		const options = buildProxyOptionsForGot()

		expect(options.agent.https.proxy.href).toBe('http://127.0.0.1:8888/')
		expect(options.https).toEqual({
			rejectUnauthorized: false,
		})
	})
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
		vi.spyOn(inquirer, 'prompt').mockResolvedValue({ postNewIssue: false })

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

describe('confirmWriteIssueMeta()', () => {
	it('defaults to yes when asking whether to write metadata back', async () => {
		const promptSpy = vi.spyOn(inquirer, 'prompt').mockResolvedValue({ writeIssueMeta: true })

		await expect(confirmWriteIssueMeta('/tmp/note.md')).resolves.toBe(true)
		expect(promptSpy).toHaveBeenCalledWith([
			expect.objectContaining({
				name: 'writeIssueMeta',
				type: 'confirm',
				default: true,
				message: 'Kup is going to write the new issue metadata back to "/tmp/note.md", OK?',
			}),
		])
	})
})

describe('confirmOverwriteDumpFile()', () => {
	it('defaults to yes when asking whether to overwrite a dump file', async () => {
		const promptSpy = vi.spyOn(inquirer, 'prompt').mockResolvedValue({ overwriteDumpFile: false })

		await expect(confirmOverwriteDumpFile('/tmp/note.md')).resolves.toBe(false)
		expect(promptSpy).toHaveBeenCalledWith([
			expect.objectContaining({
				name: 'overwriteDumpFile',
				type: 'confirm',
				default: true,
				message: 'Kup is going to overwrite the local file "/tmp/note.md", OK?',
			}),
		])
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
