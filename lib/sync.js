import ghGot from 'gh-got'
import inquirer from 'inquirer'

import { KupError, errorLine, logLine } from './error.js'
import { fileExists, readTextFile, writeTextFile } from './file.js'
import { buildIssueMarkdown, updateIssueMeta } from './meta.js'
import { isDebugging } from './util.js'

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

async function postIssue(fileInfo, repo, options = {}) {
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

		if (options.file) {
			const shouldWriteMeta = await confirmWriteIssueMeta(options.file)
			if (shouldWriteMeta) {
				await writeIssueMeta(options.file, {
					id,
					repo,
					shouldWriteRepo: options.repoSource === 'cli' && !options.hasRepoInMeta,
				})
				console.log(`[Kup] [Notice] Updated metadata in Markdown file: ${ options.file }`)
			}
		}
	}
}

async function dumpIssue(repo, id, options = {}) {
	const api = `/repos/${ repo }/issues/${ id }`
	let response = null
	console.log(`[Kup] Dumping "${ repo }#${ id }"...`)
	try {
		response = await ghGot(api, {
			token: process.env.GITHUB_TOKEN,
			...proxyOptionsForGot,
		})
	} catch (e) {
		throw new KupError([
			errorLine('[Kup] [Error] Request error: ' + e.message),
		])
	}

	if (!response) return

	const outputFile = options.file
	if (outputFile && await fileExists(outputFile)) {
		const shouldOverwrite = await confirmOverwriteDumpFile(outputFile)
		if (!shouldOverwrite) {
			throw new KupError([
				logLine('[Kup] Aborted!'),
			])
		}
	}

	const issue = response.body || {}
	const title = issue.title || ''
	const body = issue.body || ''
	const tags = Array.isArray(issue.labels)
		? issue.labels
			.map((label) => String(label?.name || '').trim())
			.filter(Boolean)
		: []
	const content = buildIssueMarkdown({
		body,
		id,
		repo,
		shouldWriteRepo: options.repoSource === 'cli',
		tags,
		title,
	})

	try {
		await writeTextFile(outputFile, content)
	} catch (e) {
		throw new KupError([
			errorLine(`[Kup] [Error] Cannot write file "${ outputFile }"!`),
			errorLine(e.message),
		])
	}

	const url = `https://github.com/${ repo }/issues/${ id }`
	console.log(`[Kup] [Success] Dumped "${ repo }#${ id }" to "${ outputFile }"!`)
	console.log(`[Kup] [Success] URL: ${ url }`)
}

async function confirmWriteIssueMeta(file) {
	const answer = await inquirer.prompt([
		{
			name: 'writeIssueMeta',
			type: 'confirm',
			message: `Kup is going to write the new issue metadata back to "${ file }", OK?`,
			default: true,
		},
	])
	return answer.writeIssueMeta
}

async function confirmOverwriteDumpFile(file) {
	const answer = await inquirer.prompt([
		{
			name: 'overwriteDumpFile',
			type: 'confirm',
			message: `Kup is going to overwrite the local file "${ file }", OK?`,
			default: false,
		},
	])
	return answer.overwriteDumpFile
}

async function writeIssueMeta(file, { id, repo, shouldWriteRepo }) {
	let content = ''
	try {
		content = await readTextFile(file)
	} catch (e) {
		throw new KupError([
			errorLine(`[Kup] [Error] Cannot read file "${ file }"!`),
			errorLine(e.message),
		])
	}

	const nextContent = updateIssueMeta(content, {
		id,
		repo,
		shouldWriteRepo,
	})

	try {
		await writeTextFile(file, nextContent)
	} catch (e) {
		throw new KupError([
			errorLine(`[Kup] [Error] Cannot write file "${ file }"!`),
			errorLine(e.message),
		])
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
	confirmOverwriteDumpFile,
	confirmWriteIssueMeta,
	dumpIssue,
	updateIssue,
	postIssue,
	writeIssueMeta,
}
