import fs from 'fs/promises'
import { findUp } from 'find-up'
import path from 'path'

import { readTextFile } from './file.js'
import { validateRepo } from './validate.js'

async function getRepo(sourceFile = '') {
	const json = await _getPkg(sourceFile)

	if (json) {
		const packageRepo = _getRepoFromPkgKup(json)
		if (packageRepo.repo) {
			return {
				repo: packageRepo.repo,
				source: 'package',
				needsConfirm: false,
			}
		}

		if (!packageRepo.hasKupRepoField) {
			const guessedRepo = _getRepoFromPkgRepo(json)
			if (guessedRepo) {
				return {
					repo: guessedRepo,
					source: 'package.repository',
					needsConfirm: true,
				}
			}
		}
	}

	const guessedRepo = await _getRepoFromGit(sourceFile)
	return {
		repo: guessedRepo,
		source: guessedRepo ? 'git.origin' : '',
		needsConfirm: !!guessedRepo,
	}
}

function _getRepoFromPkgKup(json) {
	const hasKupRepoField = !!json?.kup && Object.prototype.hasOwnProperty.call(json.kup, 'repo')
	const repo = json?.kup?.repo
	const result = validateRepo(repo)
	return {
		repo: result.status ? repo : '',
		hasKupRepoField,
	}
}
function _getRepoFromPkgRepo(json) {
	const repository = json?.repository
	if (!repository) return ''

	if (typeof repository === 'string') {
		return normalizeRepositoryToRepo(repository)
	}

	if (typeof repository === 'object' && repository.url) {
		return normalizeRepositoryToRepo(repository.url)
	}

	return ''
}
async function _getRepoFromGit(sourceFile = '') {
	const configFile = await _getGitConfigFile(sourceFile)
	if (!configFile) return ''

	let config = ''
	try {
		config = await readTextFile(configFile)
	} catch {
		return ''
	}

	return _getRepoFromGitConfig(config)
}

async function _getPkg(sourceFile = '') {
	const cwd = sourceFile ? path.resolve(path.dirname(sourceFile)) : process.cwd()
	const file = await findUp('package.json', { cwd })
	if (!file) return null

	let pkg = ''
	try {
		pkg = await readTextFile(file)
	} catch (e) {
		console.error(`[Kup] [Error] Cannot read file "${ file }"!`)
		console.error(e.message)
	}

	let json = null
	try {
		json = JSON.parse(pkg)
	} catch (e) {
		console.error('[Kup] [Error] Cannot parse `package.json` to JSON!')
		console.error(e.message)
	}
	return json
}

async function _getGitConfigFile(sourceFile = '') {
	let cwd = sourceFile ? path.resolve(path.dirname(sourceFile)) : process.cwd()
	while (true) {
		const gitPath = path.join(cwd, '.git')

		try {
			const stats = await fs.stat(gitPath)
			if (stats.isDirectory()) {
				const configFile = path.join(gitPath, 'config')
				try {
					await fs.access(configFile)
					return configFile
				} catch {
					return ''
				}
			}
			return ''
		} catch {
			const parent = path.dirname(cwd)
			if (parent === cwd) return ''
			cwd = parent
		}
	}
}

function _getRepoFromGitConfig(config) {
	if (typeof config !== 'string' || !config.trim()) return ''

	const lines = config.split(/\r?\n/)
	let inOriginRemote = false
	for (const line of lines) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue

		const sectionMatched = /^\[\s*(.*?)\s*\]$/.exec(trimmed)
		if (sectionMatched) {
			inOriginRemote = /^remote\s+"origin"$/i.test(sectionMatched[1])
			continue
		}
		if (!inOriginRemote) continue

		const entryMatched = /^([A-Za-z][\w-]*)\s*=\s*(.*?)\s*$/.exec(trimmed)
		if (!entryMatched) continue

		const key = entryMatched[1].toLowerCase()
		const value = entryMatched[2]
		if (key === 'url') return normalizeRepositoryToRepo(value)
	}

	return ''
}

function normalizeRepositoryToRepo(repository) {
	if (typeof repository !== 'string') return ''

	const value = repository.trim()
	if (!value) return ''

	const candidates = [
		/^github:([\w.-]+\/[\w.-]+)$/i,
		/^(?:git\+)?https?:\/\/github\.com\/([\w.-]+\/[\w.-]+?)(?:\.git)?(?:\/)?$/i,
		/^git@github\.com:([\w.-]+\/[\w.-]+?)(?:\.git)?$/i,
		/^ssh:\/\/git@github\.com\/([\w.-]+\/[\w.-]+?)(?:\.git)?(?:\/)?$/i,
		/^([\w.-]+\/[\w.-]+)$/,
	]

	for (const pattern of candidates) {
		const matched = pattern.exec(value)
		if (!matched) continue

		const repo = matched[1]
		const result = validateRepo(repo)
		if (result.status) return repo
	}

	return ''
}

export {
	getRepo,
	_getRepoFromPkgKup as __getRepoFromPkgKup,
	_getRepoFromPkgRepo as __getRepoFromPkgRepo,
	_getRepoFromGit as __getRepoFromGit,
	_getRepoFromGitConfig as __getRepoFromGitConfig,
	normalizeRepositoryToRepo as __normalizeRepositoryToRepo,
}
