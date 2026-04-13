import { describe, expect, it } from 'vitest'
import { execaNode } from 'execa'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import { cliPath, projectRoot } from '../helpers/paths.js'

describe('CLI', () => {
	it('shows help output', async () => {
		const result = await execaNode(cliPath, ['--help'], {
			cwd: projectRoot,
		})

		expect(result.stdout).toContain('kup <file> [options]')
		expect(result.stdout).toContain('--repo')
		expect(result.stdout).toContain('--dump')
	})

	it('supports parse-only mode for markdown without front matter', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-cli-test-'))
		const filename = path.join(tempDir, 'note.md')
		await fs.writeFile(filename, '# 一级标题 (no-meta.md)\n\n正文\n', 'utf8')

		const result = await execaNode(cliPath, [filename, '--parse-only'], {
			cwd: projectRoot,
		})

		expect(result.stdout).toContain('[Kup] [Debug] fileInfo =')
		expect(result.stdout).toContain("title: '一级标题 (no-meta.md)'")
		expect(result.stdout).toContain('[Kup] Done!')
		await fs.rm(tempDir, { recursive: true, force: true })
	})

	it('fails validation for an invalid repo argument', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-cli-test-'))
		const filename = path.join(tempDir, 'note.md')
		await fs.writeFile(filename, '# Title\n\nBody\n', 'utf8')

		const result = await execaNode(cliPath, [filename, '--repo', 'invalid'], {
			cwd: projectRoot,
			reject: false,
		})

		expect(result.exitCode).toBe(1)
		expect(result.stderr).toContain('`repo` must match `{owner}/{repo}` pattern!')
		await fs.rm(tempDir, { recursive: true, force: true })
	})

	it('prints handled main errors without a stack trace', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-cli-test-'))
		const filename = path.join(tempDir, 'note.md')
		await fs.writeFile(filename, '# Title\n\nBody\n', 'utf8')

		const result = await execaNode(cliPath, [filename], {
			cwd: projectRoot,
			reject: false,
		})

		expect(result.exitCode).toBe(1)
		expect(result.stderr).toContain('[Kup] [Error] Cannot get `repo` to sync to!')
		expect(result.stderr).not.toContain('KupError:')
		await fs.rm(tempDir, { recursive: true, force: true })
	})

	it('accepts dump mode without a file when --id is provided', async () => {
		const result = await execaNode(cliPath, ['--dump', '--repo', 'cssmagic/kup', '--id', '1', '--help'], {
			cwd: projectRoot,
		})

		expect(result.exitCode).toBe(0)
	})
})
