'use strict'

const findUp = require('find-up')
const { readTextFile } = require('./file')
const { validateRepo } = require('./validate')

async function getRepo() {
	// 目前只实现这一种方式
	return await _getRepoFromPkgKup()
}

async function _getRepoFromPkgKup() {
	const json = await _getPkg()
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

async function _getPkg() {
	const file = await findUp('package.json')

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

module.exports = {
	getRepo,
	// __getRepoFromPkgKup: _getRepoFromPkgKup,
	// __getRepoFromPkgRepo: _getRepoFromPkgRepo,
	// __getRepoFromGit: _getRepoFromGit,
}
