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

		expect(repo).toBe('cssmagic/kup-demo')
	})

	it('returns an empty string when no package.json can be found', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-repo-test-'))
		tempDirs.push(tempDir)
		const sourceFile = path.join(tempDir, 'note.md')
		await fs.writeFile(sourceFile, '# Temporary note\n', 'utf8')

		const repo = await getRepo(sourceFile)

		expect(repo).toBe('')
	})
})
