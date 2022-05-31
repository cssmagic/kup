'use strict'

const { isDebugging } = require('./util')
const { readTextFile } = require('./file')
const { parse } = require('./parse')
const { getRepo } = require('./repo')
const { updateIssue, postIssue } = require('./sync')
const { getToken } = require('./token')

async function main(argv) {
	const {
		id = 0,
		repo = '',
		_: files,
	} = argv

	// 目前只处理第一个文件
	const file = files[0]
	let content = ''
	try {
		content = await readTextFile(file)
	} catch (e) {
		console.error(`[Kup] [Error] Cannot read file "${ file }"!`)
		console.error(e.message)
		process.exit(1)
	}

	const fileInfo = parse(content)

	if (argv.parseOnly || isDebugging()) {
		console.log('[Kup] [Debug] fileInfo =', fileInfo)
		// 如果有 p 参数，则提前退出，不需要走后面的步骤
		if (argv.parseOnly) return
	}

	// 通过各种方式获取 repo
	// 优先级： 命令行参数 > 文件元数据 > 文件所在项目的 package.json 中的 `kup.repo` 字段
	let repoReal = repo || fileInfo.meta.repo
	if (!repoReal) repoReal = await getRepo()
	if (!repoReal) {
		console.error('[Kup] [Error] Cannot get `repo` to sync to!')
		process.exit(1)
	}

	// 检查 TOKEN
	if (await getToken()) {
		// 调用 GitHub API
		const idReal = id || fileInfo.meta.id
		if (idReal) {
			await updateIssue(fileInfo, repoReal, idReal)
		} else {
			await postIssue(fileInfo, repoReal)
		}
	}
}

module.exports = {
	main,
}
