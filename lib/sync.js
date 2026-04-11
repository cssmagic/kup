import ghGot from 'gh-got'
import inquirer from 'inquirer'

import { KupError, errorLine, logLine } from './error.js'
import { isDebugging } from '../lib/util.js'

let proxyOptionsForGot = {}
if (isDebugging()) {
	const { HttpsProxyAgent } = await import('https-proxy-agent')
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
	const data = buildUpdateIssuePayload(fileInfo)
	if (isDebugging()) {
		console.log('[Kup] [Debug] requestBody =', data)
	}

	// post
	const api = `/repos/${ repo }/issues/${ id }`
	const method = 'PATCH'
	let response = null
	console.log(`[Kup] Updating "${ repo }#${ id }"...`)
	try {
		response = await ghGot(api, {
			method,
			json: data,
			token: process.env.GITHUB_TOKEN,
			...proxyOptionsForGot,
		})
	} catch (e) {
		throw new KupError([
			errorLine('[Kup] [Error] Request error: ' + e.message),
		])
	}

	// handle response
	if (response) {
		const url = `https://github.com/${ repo }/issues/${ id }`
		console.log(`[Kup] [Success] Updated to "${ repo }#${ id }"!`)
		console.log(`[Kup] [Success] URL: ${ url }`)
	}
}

async function postIssue(fileInfo, repo) {
	const data = buildPostIssuePayload(fileInfo)
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
				json: data,
				token: process.env.GITHUB_TOKEN,
				...proxyOptionsForGot,
			})
		} catch (e) {
			throw new KupError([
				errorLine('[Kup] [Error] Request error: ' + e.message),
			])
		}
	} else {
		throw new KupError([
			logLine('[Kup] Aborted!'),
		])
	}

	// handle response
	if (response) {
		const id = response?.body?.number
		const url = `https://github.com/${ repo }/issues/${ id }`
		console.log(`[Kup] [Success] Posted to "${ repo }#${ id }"!`)
		console.log(`[Kup] [Success] URL: ${ url }`)

		// write back meta data
		// TODO
	}
}

function buildUpdateIssuePayload(fileInfo) {
	// 因为接口是 PATCH 方法，只需要提供需要更新的字段
	// Markdown 文件未提供的字段就不提交了，而不是提交空值，以免清空已有值
	const title = fileInfo.meta.title || fileInfo.title
	const body = fileInfo.content
	const data = { body }
	if (title) data.title = title
	if (fileInfo.meta.tags) data.labels = fileInfo.meta.tags
	return data
}

function buildPostIssuePayload(fileInfo) {
	const title = fileInfo.meta.title || fileInfo.title || 'Issue posted by Kup @' + new Date().toISOString()
	const body = fileInfo.content
	const data = { title, body }
	if (fileInfo.meta.tags) data.labels = fileInfo.meta.tags
	return data
}

export {
	buildPostIssuePayload,
	buildUpdateIssuePayload,
	updateIssue,
	postIssue,
}
