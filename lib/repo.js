import { findUp } from 'find-up'
import path from 'path'

import { readTextFile } from './file.js'
import { validateRepo } from './validate.js'

async function getRepo(sourceFile = '') {
	const json = await _getPkg(sourceFile)
	if (!json) {
		return {
			repo: '',
			source: '',
			needsConfirm: false,
		}
	}

	const packageRepo = _getRepoFromPkgKup(json)
	if (packageRepo.hasRepoField) {
		return {
			repo: packageRepo.repo,
			source: packageRepo.repo ? 'package' : '',
			needsConfirm: false,
		}
	}

	const guessedRepo = _getRepoFromPkgRepo(json)
	return {
		repo: guessedRepo,
		source: guessedRepo ? 'package.repository' : '',
		needsConfirm: !!guessedRepo,
	}
}

function _getRepoFromPkgKup(json) {
	const hasRepoField = !!json?.kup && Object.prototype.hasOwnProperty.call(json.kup, 'repo')
	const repo = json?.kup?.repo
	const result = validateRepo(repo)
	return {
		repo: result.status ? repo : '',
		hasRepoField,
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
async function _getRepoFromGit() {
	// TODO
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
	// __getRepoFromGit: _getRepoFromGit,
	normalizeRepositoryToRepo as __normalizeRepositoryToRepo,
}
