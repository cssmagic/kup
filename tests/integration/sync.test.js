import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import inquirer from 'inquirer'
import nock from 'nock'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import { dumpIssue, postIssue, updateIssue } from '../../lib/sync.js'

describe('sync', () => {
	const tempDirs = []
	const fileInfo = {
		meta: {
			title: 'Meta title',
			tags: ['Doc'],
		},
		title: 'Body title',
		content: 'Body content',
	}

	beforeEach(() => {
		process.env.GITHUB_TOKEN = 'ghp_test_token'
	})

	afterEach(() => {
		vi.restoreAllMocks()
		nock.cleanAll()
		delete process.env.GITHUB_TOKEN
	})

	afterEach(async () => {
		await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
	})

	it('updates an existing issue with the expected payload', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		const scope = nock('https://api.github.com', {
			reqheaders: {
				authorization: 'token ghp_test_token',
			},
		})
			.patch('/repos/cssmagic/kup/issues/42', {
				title: 'Meta title',
				body: 'Body content',
				labels: ['Doc'],
			})
			.reply(200, { number: 42 })

		await updateIssue(fileInfo, 'cssmagic/kup', 42)

		expect(scope.isDone()).toBe(true)
		expect(logSpy).toHaveBeenCalledWith('[Kup] [Success] Updated to "cssmagic/kup#42"!')
		expect(logSpy).toHaveBeenCalledWith('[Kup] [Success] URL: https://github.com/cssmagic/kup/issues/42')
	})

	it('posts a new issue after confirmation', async () => {
		vi.spyOn(inquirer, 'prompt').mockResolvedValue({ postNewIssue: true })
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		const scope = nock('https://api.github.com', {
			reqheaders: {
				authorization: 'token ghp_test_token',
			},
		})
			.post('/repos/cssmagic/kup/issues', {
				title: 'Meta title',
				body: 'Body content',
				labels: ['Doc'],
			})
			.reply(201, { number: 99 })

		await postIssue(fileInfo, 'cssmagic/kup')

		expect(scope.isDone()).toBe(true)
		expect(logSpy).toHaveBeenCalledWith('[Kup] [Success] Posted to "cssmagic/kup#99"!')
		expect(logSpy).toHaveBeenCalledWith('[Kup] [Success] URL: https://github.com/cssmagic/kup/issues/99')
	})

	it('writes id back to the markdown file after posting a new issue', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-sync-integration-'))
		tempDirs.push(tempDir)
		const filename = path.join(tempDir, 'note.md')
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await fs.writeFile(filename, [
			'---',
			'id:',
			'tags: []',
			'---',
			'',
			'Body content',
		].join('\n'), 'utf8')

		const promptSpy = vi.spyOn(inquirer, 'prompt')
		promptSpy
			.mockResolvedValueOnce({ postNewIssue: true })
			.mockResolvedValueOnce({ writeIssueMeta: true })
		nock('https://api.github.com', {
			reqheaders: {
				authorization: 'token ghp_test_token',
			},
		})
			.post('/repos/cssmagic/kup/issues', (body) => {
				expect(body).toMatchObject({
					body: 'Body content',
					labels: ['Doc'],
				})
				expect(body.title).toMatch(/^Issue posted by Kup @/)
				return true
			})
			.reply(201, { number: 108 })

		await postIssue({
			meta: {
				id: '',
				tags: ['Doc'],
			},
			title: '',
			content: 'Body content',
		}, 'cssmagic/kup', {
			file: filename,
			repoSource: 'package',
			hasRepoInMeta: false,
		})

		await expect(fs.readFile(filename, 'utf8')).resolves.toBe([
			'---',
			'id: 108',
			'tags: []',
			'---',
			'',
			'Body content',
		].join('\n'))
		expect(logSpy).toHaveBeenCalledWith(`[Kup] [Notice] Updated metadata in Markdown file: ${ filename }`)
	})

	it('skips writing metadata when the user declines the write-back prompt', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-sync-integration-'))
		tempDirs.push(tempDir)
		const filename = path.join(tempDir, 'note.md')
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		await fs.writeFile(filename, [
			'---',
			'tags: []',
			'---',
			'',
			'Body content',
		].join('\n'), 'utf8')

		const promptSpy = vi.spyOn(inquirer, 'prompt')
		promptSpy
			.mockResolvedValueOnce({ postNewIssue: true })
			.mockResolvedValueOnce({ writeIssueMeta: false })
		nock('https://api.github.com', {
			reqheaders: {
				authorization: 'token ghp_test_token',
			},
		})
			.post('/repos/cssmagic/kup/issues', (body) => {
				expect(body).toMatchObject({
					body: 'Body content',
					labels: ['Doc'],
				})
				expect(body.title).toMatch(/^Issue posted by Kup @/)
				return true
			})
			.reply(201, { number: 109 })

		await postIssue({
			meta: {
				tags: ['Doc'],
			},
			title: '',
			content: 'Body content',
		}, 'cssmagic/kup', {
			file: filename,
			repoSource: 'cli',
			hasRepoInMeta: false,
		})

		await expect(fs.readFile(filename, 'utf8')).resolves.toBe([
			'---',
			'tags: []',
			'---',
			'',
			'Body content',
		].join('\n'))
		expect(promptSpy).toHaveBeenNthCalledWith(2, [
			expect.objectContaining({
				name: 'writeIssueMeta',
				default: true,
			}),
		])
		expect(logSpy).not.toHaveBeenCalledWith(`[Kup] [Notice] Updated metadata in Markdown file: ${ filename }`)
	})

	it('dumps an issue into a markdown file with metadata', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-sync-integration-'))
		tempDirs.push(tempDir)
		const filename = path.join(tempDir, '42.md')
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		const scope = nock('https://api.github.com', {
			reqheaders: {
				authorization: 'token ghp_test_token',
			},
		})
			.get('/repos/cssmagic/kup/issues/42')
			.reply(200, {
				number: 42,
				title: 'Need: #1',
				body: 'Body content',
				labels: [
					{ name: 'bug' },
					{ name: 'help wanted' },
				],
			})

		await dumpIssue('cssmagic/kup', 42, {
			file: filename,
			repoSource: 'cli',
		})

		expect(scope.isDone()).toBe(true)
		await expect(fs.readFile(filename, 'utf8')).resolves.toBe([
			'---',
			'repo: cssmagic/kup',
			'id: 42',
			'tags: [bug, help wanted]',
			'title: "Need: #1"',
			'---',
			'',
			'Body content',
		].join('\n'))
		expect(logSpy).toHaveBeenCalledWith(`[Kup] [Success] Dumped "cssmagic/kup#42" to "${ filename }"!`)
		expect(logSpy).toHaveBeenCalledWith('[Kup] [Success] URL: https://github.com/cssmagic/kup/issues/42')
	})
})
