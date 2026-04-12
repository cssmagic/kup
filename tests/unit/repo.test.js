import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import { afterEach, describe, expect, it } from 'vitest'

import {
	__getRepoFromGit,
	__getRepoFromGitConfig,
	__getRepoFromPkgKup,
	__getRepoFromPkgRepo,
	__normalizeRepositoryToRepo,
	getRepo,
} from '../../lib/repo.js'

const tempDirs = []

afterEach(async () => {
	await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
})

describe('getRepo()', () => {
	it('finds kup.repo by walking upward from the markdown file path', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-repo-test-'))
		tempDirs.push(tempDir)
		const nestedDir = path.join(tempDir, 'docs', 'notes')
		await fs.mkdir(nestedDir, { recursive: true })
		const sourceFile = path.join(nestedDir, 'note.md')
		await fs.writeFile(sourceFile, '# Temporary note\n', 'utf8')
		await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
			kup: {
				repo: 'cssmagic/kup-demo',
			},
		}, null, '\t'), 'utf8')

		const repo = await getRepo(sourceFile)

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

	it('guesses repo from .git/config when package-based lookup fails', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-repo-test-'))
		tempDirs.push(tempDir)
		const nestedDir = path.join(tempDir, 'docs', 'notes')
		await fs.mkdir(path.join(tempDir, '.git'), { recursive: true })
		await fs.mkdir(nestedDir, { recursive: true })
		const sourceFile = path.join(nestedDir, 'note.md')
		await fs.writeFile(sourceFile, '# Temporary note\n', 'utf8')
		await fs.writeFile(path.join(tempDir, '.git', 'config'), [
			'[core]',
			'\trepositoryformatversion = 0',
			'[remote "origin"]',
			'\turl = git@github.com:cssmagic/kup.git',
		].join('\n'), 'utf8')

		const repo = await getRepo(sourceFile)

		expect(repo).toEqual({
			repo: 'cssmagic/kup',
			source: 'git.origin',
			needsConfirm: true,
		})
	})

	it('prefers package.json#repository over .git/config fallback', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-repo-test-'))
		tempDirs.push(tempDir)
		await fs.mkdir(path.join(tempDir, '.git'), { recursive: true })
		const sourceFile = path.join(tempDir, 'note.md')
		await fs.writeFile(sourceFile, '# Temporary note\n', 'utf8')
		await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
			repository: 'github:cssmagic/from-package',
		}, null, '\t'), 'utf8')
		await fs.writeFile(path.join(tempDir, '.git', 'config'), [
			'[remote "origin"]',
			'\turl = git@github.com:cssmagic/from-git.git',
		].join('\n'), 'utf8')

		const repo = await getRepo(sourceFile)

		expect(repo).toEqual({
			repo: 'cssmagic/from-package',
			source: 'package.repository',
			needsConfirm: true,
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

describe('normalizeRepositoryToRepo()', () => {
	it.each([
		['cssmagic/kup', 'cssmagic/kup'],
		['github:cssmagic/kup', 'cssmagic/kup'],
		['https://github.com/cssmagic/kup', 'cssmagic/kup'],
		['https://github.com/cssmagic/kup/', 'cssmagic/kup'],
		['git+https://github.com/cssmagic/kup.git', 'cssmagic/kup'],
		['git@github.com:cssmagic/kup.git', 'cssmagic/kup'],
		['ssh://git@github.com/cssmagic/kup.git', 'cssmagic/kup'],
		['github:cssmagic/kup.cli', 'cssmagic/kup.cli'],
	])('normalizes %s', (input, expected) => {
		expect(__normalizeRepositoryToRepo(input)).toBe(expected)
	})

	it.each([
		'',
		'   ',
		'https://gitlab.com/cssmagic/kup',
		'git+https://example.com/cssmagic/kup.git',
		'not a repo',
		'cssmagic',
	])('returns empty string for unsupported input: %s', (input) => {
		expect(__normalizeRepositoryToRepo(input)).toBe('')
	})
})

describe('_getRepoFromPkgKup()', () => {
	it('returns the repo and marks the field as present when kup.repo is valid', () => {
		expect(__getRepoFromPkgKup({
			kup: {
				repo: 'cssmagic/kup',
			},
		})).toEqual({
			repo: 'cssmagic/kup',
			hasKupRepoField: true,
		})
	})

	it('returns an empty repo but preserves field presence when kup.repo is invalid', () => {
		expect(__getRepoFromPkgKup({
			kup: {
				repo: 'invalid repo',
			},
		})).toEqual({
			repo: '',
			hasKupRepoField: true,
		})
	})

	it('returns empty repo and no field marker when kup.repo is absent', () => {
		expect(__getRepoFromPkgKup({
			kup: {},
		})).toEqual({
			repo: '',
			hasKupRepoField: false,
		})
	})
})

describe('_getRepoFromPkgRepo()', () => {
	it('extracts repo from a repository string', () => {
		expect(__getRepoFromPkgRepo({
			repository: 'github:cssmagic/kup',
		})).toBe('cssmagic/kup')
	})

	it('extracts repo from repository.url object form', () => {
		expect(__getRepoFromPkgRepo({
			repository: {
				type: 'git',
				url: 'git+https://github.com/cssmagic/kup.git',
			},
		})).toBe('cssmagic/kup')
	})

	it('returns empty string when repository object has no url', () => {
		expect(__getRepoFromPkgRepo({
			repository: {
				type: 'git',
			},
		})).toBe('')
	})

	it('returns empty string for unsupported repository values', () => {
		expect(__getRepoFromPkgRepo({
			repository: 42,
		})).toBe('')
	})
})

describe('_getRepoFromGitConfig()', () => {
	it('extracts repo from remote origin url', () => {
		expect(__getRepoFromGitConfig([
			'[core]',
			'\trepositoryformatversion = 0',
			'[remote "origin"]',
			'\turl = git+https://github.com/cssmagic/kup.git',
		].join('\n'))).toBe('cssmagic/kup')
	})

	it('ignores other remotes when origin is absent', () => {
		expect(__getRepoFromGitConfig([
			'[remote "upstream"]',
			'\turl = git@github.com:cssmagic/kup.git',
		].join('\n'))).toBe('')
	})

	it('returns empty string when origin has no url', () => {
		expect(__getRepoFromGitConfig([
			'[remote "origin"]',
			'\tfetch = +refs/heads/*:refs/remotes/origin/*',
		].join('\n'))).toBe('')
	})

	it('returns empty string for unsupported origin url', () => {
		expect(__getRepoFromGitConfig([
			'[remote "origin"]',
			'\turl = git@gitlab.com:cssmagic/kup.git',
		].join('\n'))).toBe('')
	})
})

describe('_getRepoFromGit()', () => {
	it('returns repo from the nearest parent git config', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-repo-test-'))
		tempDirs.push(tempDir)
		const nestedDir = path.join(tempDir, 'docs', 'notes')
		await fs.mkdir(path.join(tempDir, '.git'), { recursive: true })
		await fs.mkdir(nestedDir, { recursive: true })
		const sourceFile = path.join(nestedDir, 'note.md')
		await fs.writeFile(sourceFile, '# Temporary note\n', 'utf8')
		await fs.writeFile(path.join(tempDir, '.git', 'config'), [
			'[remote "origin"]',
			'\turl = ssh://git@github.com/cssmagic/kup.git',
		].join('\n'), 'utf8')

		await expect(__getRepoFromGit(sourceFile)).resolves.toBe('cssmagic/kup')
	})

	it('returns empty string when .git directory is missing', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-repo-test-'))
		tempDirs.push(tempDir)
		const sourceFile = path.join(tempDir, 'note.md')
		await fs.writeFile(sourceFile, '# Temporary note\n', 'utf8')

		await expect(__getRepoFromGit(sourceFile)).resolves.toBe('')
	})

	it('returns empty string when .git exists as a file', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-repo-test-'))
		tempDirs.push(tempDir)
		const sourceFile = path.join(tempDir, 'note.md')
		await fs.writeFile(sourceFile, '# Temporary note\n', 'utf8')
		await fs.writeFile(path.join(tempDir, '.git'), 'gitdir: /tmp/demo\n', 'utf8')

		await expect(__getRepoFromGit(sourceFile)).resolves.toBe('')
	})

	it('returns empty string when git config file is missing', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kup-repo-test-'))
		tempDirs.push(tempDir)
		await fs.mkdir(path.join(tempDir, '.git'), { recursive: true })
		const sourceFile = path.join(tempDir, 'note.md')
		await fs.writeFile(sourceFile, '# Temporary note\n', 'utf8')

		await expect(__getRepoFromGit(sourceFile)).resolves.toBe('')
	})
})
