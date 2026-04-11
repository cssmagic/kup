import inquirer from 'inquirer'

import { KupError, errorLine, logLine } from './error.js'

async function getToken() {
	let token = process.env.GITHUB_TOKEN
	if (!token) {
		console.error(`[Kup] Cannot find GitHub Token via env variable $GITHUB_TOKEN!`)
		token = await _askToken()
		// 把用户提供的 token 写入环境变量，不过只对当前进程有效
		process.env.GITHUB_TOKEN = token
	} else if (!validateToken(token)) {
		throw new KupError([
			errorLine('[Kup] [Error] The GitHub token you provide is invalid!'),
			errorLine('[Kup] [Error] It must be a classic (ghp_...) or fine-grained (github_pat_...) PAT.'),
		])
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
		throw new KupError([
			logLine('[Kup] Aborted!'),
		])
	} else if (!validateToken(token)) {
		throw new KupError([
			errorLine('[Kup] [Error] The GitHub token you provide is invalid!'),
			errorLine('[Kup] [Error] It must be a classic (ghp_...) or fine-grained (github_pat_...) PAT.'),
		])
	}
	return token
}

function validateToken(token) {
	if (typeof token !== 'string' || token.length < 20) return false
	// classic PAT：ghp_...
	// fine-grained PAT：github_pat_...
	const RE = /^(ghp_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)$/
	return RE.test(token.trim())
}


export {
	getToken,
	validateToken,
}
