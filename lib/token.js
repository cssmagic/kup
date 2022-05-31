'use strict'

const inquirer = require('inquirer')

async function getToken() {
	let token = process.env.GITHUB_TOKEN
	if (!token) {
		console.error(`[Kup] Cannot find GitHub Token via env variable $GITHUB_TOKEN!`)
		token = await _askToken()
		// 把用户提供的 token 写入环境变量，不过只对当前进程有效
		process.env.GITHUB_TOKEN = token
	} else if (!_validateToken(token)) {
		console.error('[Kup] [Error] The GitHub token you provide is invalid!')
		console.error('[Kup] [Error] The GitHub token must be a "Personal Access Token"!')
		process.exit(1)
	}
	return token
}

async function _askToken() {
	const answer = await inquirer.prompt([
		{
			name: 'token',
			type: 'input',
			message: `Please input your GitHub token here:`,
		},
	])
	const token = answer.token
	if (!token) {
		console.log('[Kup] Aborted!')
		process.exit(1)
	} else if (!_validateToken(token)) {
		console.error('[Kup] [Error] The GitHub token you provide is invalid!')
		console.error('[Kup] [Error] The GitHub token must be a "Personal Access Token"!')
		process.exit(1)
	}
	return token
}

function _validateToken(token) {
	const RE = /^ghp_\w+$/
	return RE.test(token)
}


module.exports = {
	getToken,
}
