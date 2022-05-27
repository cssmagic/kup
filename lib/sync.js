'use strict'

const ghGot = require('gh-got')
const inquirer = require('inquirer')
const { isDebugging } = require('../lib/util')

let proxyOptionsForGot = {}
if (isDebugging()) {
	const HttpsProxyAgent = require('https-proxy-agent')
	const agent = new HttpsProxyAgent('http://127.0.0.1:8888')
	proxyOptionsForGot = {
		agent: {
			https: agent,
		},
		// 由于 Charles 证书无法通过校验，需要通过这个选项来放行
		rejectUnauthorized: false,
	}
}

async function updateIssue(fileInfo, repo, id) {
	console.log('update issue')
	// TODO
}

async function postIssue(fileInfo, repo) {
	// prepare fields
	const title = fileInfo.meta.title || fileInfo.title || 'Issue posted by Kup @' + new Date().toISOString()
	const body = fileInfo.content
	const data = { title, body }
	if (fileInfo.meta.tags) data.labels = fileInfo.meta.tags
	// console.log(data)

	// ask user if Kup should post a new issue
	const answer = await inquirer.prompt([
		{
			name: 'postNewIssue',
			type: 'confirm',
			message: `Kup is going to post a new issue to "${ repo }", OK?`,
			default: true
		}
	])

	// post
	const api = `/repos/${ repo }/issues`
	const method = 'POST'
	let response = null
	if (answer.postNewIssue) {
		try {
			response = await ghGot(api, {
				method,
				body: data,
				...proxyOptionsForGot,
			})
		} catch (e) {
			console.error('[Kup] [Error] Request error:', e.message)
			process.exit(1)
		}
	} else {
		console.log('[Kup] Aborted!')
		process.exit(0)
	}

	// handle response
	if (response) {
		const id = response?.body?.number
		console.log(`[Kup] [Success] Posted to "${ repo }#${ id }"!`)

		// write back meta data
		// TODO
	}
}

module.exports = {
	updateIssue,
	postIssue,
}
