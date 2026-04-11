import { describe, expect, it } from 'vitest'
import { execaNode } from 'execa'

import { cliPath, fixturePath, projectRoot } from '../helpers/paths.js'

describe('CLI', () => {
	it('shows help output', async () => {
		const result = await execaNode(cliPath, ['--help'], {
			cwd: projectRoot,
		})

		expect(result.stdout).toContain('Usage: kup <file> [options]')
		expect(result.stdout).toContain('--repo')
	})

	it('supports parse-only mode for markdown without front matter', async () => {
		const result = await execaNode(cliPath, [fixturePath('no-meta.md'), '--parse-only'], {
			cwd: projectRoot,
		})

		expect(result.stdout).toContain('[Kup] [Debug] fileInfo =')
		expect(result.stdout).toContain("title: '一级标题 (no-meta.md)'")
		expect(result.stdout).toContain('[Kup] Done!')
	})

	it('fails validation for an invalid repo argument', async () => {
		const result = await execaNode(cliPath, [fixturePath('no-meta.md'), '--repo', 'invalid'], {
			cwd: projectRoot,
			reject: false,
		})

		expect(result.exitCode).toBe(1)
		expect(result.stderr).toContain('`repo` must match `{owner}/{repo}` pattern!')
	})
})
