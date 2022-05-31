'use strict'

const ghGot = require('gh-got')
const inquirer = require('inquirer')
const { isDebugging } = require('../lib/util')

let proxyOptionsForGot = {}
if (isDebugging()) {
	const HttpsProxyAgent = require('https-proxy-agent')
	const CHARLES_PROXY = 'http://127.0.0.1:8888'
	const agent = new HttpsProxyAgent(CHARLES_PROXY)
	proxyOptionsForGot = {
		agent: {
			https: agent,
		},
		// 由于 Charles 证书无法通过校验，需要通过这个选项来放行
		rejectUnauthorized: false,
	}
}

async function updateIssue(fileInfo, repo, id) {
	// prepare fields
	// 因为接口是 PATCH 方法，只需要提供需要更新的字段
	// Markdown 文件未提供的字段就不提交了，而不是提交空值，以免清空已有值
	const title = fileInfo.meta.title || fileInfo.title
	const body = fileInfo.content
	const data = { body }
	if (title) data.title = title
	if (fileInfo.meta.tags) data.labels = fileInfo.meta.tags
	if (isDebugging()) {
		console.log('[Kup] [Debug] requestBody =', data)
	}

	// post
	const api = `/repos/${ repo }/issues/${ id }`
	const method = 'PATCH'
	let response = null
	console.log(`[Kup] Updating to "${ repo }#${ id }"...`)
	try {
		response = await ghGot(api, {
			method,
			body: data,
			token: process.env.GITHUB_TOKEN,
			...proxyOptionsForGot,
		})
	} catch (e) {
		console.error('[Kup] [Error] Request error:', e.message)
		process.exit(1)
	}

	// handle response
	if (response) {
		console.log(`[Kup] [Success] Updated to "${ repo }#${ id }"!`)
	}
}

async function postIssue(fileInfo, repo) {
	// prepare fields
	const title = fileInfo.meta.title || fileInfo.title || 'Issue posted by Kup @' + new Date().toISOString()
	const body = fileInfo.content
	const data = { title, body }
	if (fileInfo.meta.tags) data.labels = fileInfo.meta.tags
	if (isDebugging()) {
		console.log('[Kup] [Debug] requestBody =', data)
	}

	// ask user if Kup should post a new issue
	const answer = await inquirer.prompt([
		{
			name: 'postNewIssue',
			type: 'confirm',
			message: `Kup is going to post a new issue to "${ repo }", OK?`,
			default: true,
		},
	])

	// post
	const api = `/repos/${ repo }/issues`
	const method = 'POST'
	let response = null
	if (answer.postNewIssue) {
		console.log(`[Kup] Posting to "${ repo }"...`)
		try {
			response = await ghGot(api, {
				method,
				body: data,
				token: process.env.GITHUB_TOKEN,
				...proxyOptionsForGot,
			})
		} catch (e) {
			console.error('[Kup] [Error] Request error:', e.message)
			process.exit(1)
		}
	} else {
		console.log('[Kup] Aborted!')
		process.exit(1)
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
