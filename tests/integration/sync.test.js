import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import inquirer from 'inquirer'
import nock from 'nock'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import { postIssue, updateIssue } from '../../lib/sync.js'

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
		await fs.writeFile(filename, [
			'---',
			'id:',
			'tags: []',
			'---',
			'',
			'Body content',
		].join('\n'), 'utf8')

		vi.spyOn(inquirer, 'prompt').mockResolvedValue({ postNewIssue: true })
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
	})
})
