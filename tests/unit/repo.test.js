import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import { afterEach, describe, expect, it } from 'vitest'

import { getRepo } from '../../lib/repo.js'
import { fixturePath } from '../helpers/paths.js'

const tempDirs = []

afterEach(async () => {
	await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
})

describe('getRepo()', () => {
	it('finds kup.repo by walking upward from the markdown file path', async () => {
		const repo = await getRepo(fixturePath('no-meta.md'))

		expect(repo).toEqual({
			repo: 'cssmagic/kup-demo',
			source: 'package',
			needsConfirm: false,
		})
	})

	it('returns an empty string when no package.json can be found', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-repo-test-'))
		tempDirs.push(tempDir)
		const sourceFile = path.join(tempDir, 'note.md')
		await fs.writeFile(sourceFile, '# Temporary note\n', 'utf8')

		const repo = await getRepo(sourceFile)

		expect(repo).toEqual({
			repo: '',
			source: '',
			needsConfirm: false,
		})
	})

	it('guesses repo from repository.url when kup.repo is absent', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-repo-test-'))
		tempDirs.push(tempDir)
		const sourceFile = path.join(tempDir, 'note.md')
		await fs.writeFile(sourceFile, '# Temporary note\n', 'utf8')
		await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
			repository: {
				type: 'git',
				url: 'git+https://github.com/cssmagic/kup.git',
			},
		}, null, '\t'), 'utf8')

		const repo = await getRepo(sourceFile)

		expect(repo).toEqual({
			repo: 'cssmagic/kup',
			source: 'package.repository',
			needsConfirm: true,
		})
	})

	it('supports github shorthand in repository string', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-repo-test-'))
		tempDirs.push(tempDir)
		const sourceFile = path.join(tempDir, 'note.md')
		await fs.writeFile(sourceFile, '# Temporary note\n', 'utf8')
		await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
			repository: 'github:cssmagic/kup',
		}, null, '\t'), 'utf8')

		const repo = await getRepo(sourceFile)

		expect(repo).toEqual({
			repo: 'cssmagic/kup',
			source: 'package.repository',
			needsConfirm: true,
		})
	})

	it('does not fall back to repository when kup.repo field exists but is invalid', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-repo-test-'))
		tempDirs.push(tempDir)
		const sourceFile = path.join(tempDir, 'note.md')
		await fs.writeFile(sourceFile, '# Temporary note\n', 'utf8')
		await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
			kup: {
				repo: 'invalid repo',
			},
			repository: 'github:cssmagic/kup',
		}, null, '\t'), 'utf8')

		const repo = await getRepo(sourceFile)

		expect(repo).toEqual({
			repo: '',
			source: '',
			needsConfirm: false,
		})
	})
})
