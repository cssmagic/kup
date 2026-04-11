import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import { afterEach, describe, expect, it } from 'vitest'

import { readTextFile, writeTextFile } from '../../lib/file.js'

const tempDirs = []

afterEach(async () => {
	await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
})

describe('file helpers', () => {
	it('removes a UTF-8 BOM when reading text files', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-file-test-'))
		tempDirs.push(tempDir)
		const filename = path.join(tempDir, 'bom.md')
		await fs.writeFile(filename, Buffer.from([0xEF, 0xBB, 0xBF, ...Buffer.from('Hello')] ))

		await expect(readTextFile(filename)).resolves.toBe('Hello')
	})

	it('returns a promise from writeTextFile and writes the content', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-file-test-'))
		tempDirs.push(tempDir)
		const filename = path.join(tempDir, 'note.md')

		await expect(writeTextFile(filename, 'Saved content\n')).resolves.toBeUndefined()
		await expect(fs.readFile(filename, 'utf8')).resolves.toBe('Saved content\n')
	})
})
