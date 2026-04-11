import { findUp } from 'find-up'
import path from 'path'

import { readTextFile } from './file.js'
import { validateRepo } from './validate.js'

async function getRepo(sourceFile = '') {
	// 目前只实现这一种方式
	return await _getRepoFromPkgKup(sourceFile)
}

async function _getRepoFromPkgKup(sourceFile = '') {
	const json = await _getPkg(sourceFile)
	const repo = json?.kup?.repo
	const result = validateRepo(repo)
	return result.status ? repo : ''
}
async function _getRepoFromPkgRepo() {
	// TODO
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

export {
	getRepo,
	// __getRepoFromPkgKup: _getRepoFromPkgKup,
	// __getRepoFromPkgRepo: _getRepoFromPkgRepo,
	// __getRepoFromGit: _getRepoFromGit,
}
