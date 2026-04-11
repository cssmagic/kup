import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import inquirer from 'inquirer'
import nock from 'nock'

import { postIssue, updateIssue } from '../../lib/sync.js'

describe('sync', () => {
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
})
