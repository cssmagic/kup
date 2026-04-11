import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import { afterEach, describe, expect, it, vi } from 'vitest'
import inquirer from 'inquirer'

import { KupError } from '../../lib/error.js'
import { main } from '../../lib/main.js'
import * as syncModule from '../../lib/sync.js'

const tempDirs = []

afterEach(async () => {
	vi.restoreAllMocks()
	delete process.env.GITHUB_TOKEN
	await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
})

describe('main()', () => {
	it('throws a KupError when the input file cannot be read', async () => {
		await expect(main({
			_: ['missing.md'],
			repo: '',
			id: 0,
		})).rejects.toMatchObject({
			name: 'KupError',
			outputLines: [
				{ method: 'error', text: '[Kup] [Error] Cannot read file "missing.md"!' },
				expect.objectContaining({ method: 'error' }),
			],
		})
	})

	it('throws a KupError when no repo can be resolved', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-main-test-'))
		tempDirs.push(tempDir)
		const filename = path.join(tempDir, 'note.md')
		await fs.writeFile(filename, '# Title\n\nBody\n', 'utf8')

		await expect(main({
			_: [filename],
			repo: '',
			id: 0,
		})).rejects.toMatchObject({
			name: 'KupError',
			outputLines: [
				{ method: 'error', text: '[Kup] [Error] Cannot get `repo` to sync to!' },
			],
		})
	})

	it('stops early in parse-only mode without reaching token lookup', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-main-test-'))
		tempDirs.push(tempDir)
		const filename = path.join(tempDir, 'note.md')
		await fs.writeFile(filename, '# Title\n\nBody\n', 'utf8')
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

		await expect(main({
			_: [filename],
			repo: '',
			id: 0,
			parseOnly: true,
		})).resolves.toBeUndefined()

		expect(logSpy).toHaveBeenCalledWith('[Kup] [Debug] fileInfo =', {
			meta: {},
			title: 'Title',
			content: 'Body\n',
		})
	})

	it('passes repo source metadata to postIssue() when creating a new issue', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-main-test-'))
		tempDirs.push(tempDir)
		const filename = path.join(tempDir, 'note.md')
		await fs.writeFile(filename, '# Title\n\nBody\n', 'utf8')
		process.env.GITHUB_TOKEN = 'ghp_test_token_value_12345'

		const postSpy = vi.spyOn(syncModule, 'postIssue').mockResolvedValue(undefined)

		await expect(main({
			_: [filename],
			repo: 'cssmagic/kup',
			id: 0,
		})).resolves.toBeUndefined()

		expect(postSpy).toHaveBeenCalledWith(expect.any(Object), 'cssmagic/kup', {
			file: filename,
			repoSource: 'cli',
			hasRepoInMeta: false,
		})
	})

	it('prompts before using a repo guessed from package.json#repository', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-main-test-'))
		tempDirs.push(tempDir)
		const filename = path.join(tempDir, 'note.md')
		await fs.writeFile(filename, '# Title\n\nBody\n', 'utf8')
		await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
			repository: {
				type: 'git',
				url: 'git+https://github.com/cssmagic/kup.git',
			},
		}, null, '\t'), 'utf8')
		process.env.GITHUB_TOKEN = 'ghp_test_token_value_12345'

		vi.spyOn(inquirer, 'prompt').mockResolvedValue({ useGuessedRepo: true })
		const postSpy = vi.spyOn(syncModule, 'postIssue').mockResolvedValue(undefined)

		await expect(main({
			_: [filename],
			repo: '',
			id: 0,
		})).resolves.toBeUndefined()

		expect(postSpy).toHaveBeenCalledWith(expect.any(Object), 'cssmagic/kup', {
			file: filename,
			repoSource: 'package.repository',
			hasRepoInMeta: false,
		})
	})

	it('continues to fail when the user rejects a guessed repo', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-main-test-'))
		tempDirs.push(tempDir)
		const filename = path.join(tempDir, 'note.md')
		await fs.writeFile(filename, '# Title\n\nBody\n', 'utf8')
		await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
			repository: 'github:cssmagic/kup',
		}, null, '\t'), 'utf8')

		vi.spyOn(inquirer, 'prompt').mockResolvedValue({ useGuessedRepo: false })

		await expect(main({
			_: [filename],
			repo: '',
			id: 0,
		})).rejects.toMatchObject({
			name: 'KupError',
			outputLines: [
				{ method: 'error', text: '[Kup] [Error] Cannot get `repo` to sync to!' },
			],
		})
	})
})
