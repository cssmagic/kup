import { describe, expect, it, vi } from 'vitest'

import { KupError } from '../../lib/error.js'
import { buildPostIssuePayload, buildUpdateIssuePayload, postIssue } from '../../lib/sync.js'

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
