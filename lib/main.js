import inquirer from 'inquirer'

import { isDebugging } from './util.js'
import { KupError, errorLine } from './error.js'
import { readTextFile } from './file.js'
import { parse } from './parse.js'
import { getRepo } from './repo.js'
import { updateIssue, postIssue } from './sync.js'
import { getToken } from './token.js'

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
		throw new KupError([
			errorLine(`[Kup] [Error] Cannot read file "${ file }"!`),
			errorLine(e.message),
		])
	}

	const fileInfo = parse(content)

	if (argv.parseOnly || isDebugging()) {
		console.log('[Kup] [Debug] fileInfo =', fileInfo)
		// 如果有 p 参数，则提前退出，不需要走后面的步骤
		if (argv.parseOnly) return
	}

	// 通过各种方式获取 repo
	// 优先级：
	//   P1 命令行参数
	//   P2 文件元数据
	//   P3 package.json 中的 `kup.repo` 字段
	//   P4 package.json 中的 `repository` 字段（需确认）
	let repoReal = ''
	let repoSource = ''
	if (repo) {
		repoReal = repo
		repoSource = 'cli'
	} else if (fileInfo.meta.repo) {
		repoReal = fileInfo.meta.repo
		repoSource = 'meta'
	} else {
		const repoResult = await getRepo(file)
		if (repoResult.needsConfirm) {
			const answer = await inquirer.prompt([
				{
					name: 'useGuessedRepo',
					type: 'confirm',
					message: `Kup guessed the GitHub repo "${ repoResult.repo }" from package.json#repository, use it?`,
					default: true,
				},
			])
			if (answer.useGuessedRepo) {
				repoReal = repoResult.repo
				repoSource = repoResult.source
			}
		} else if (repoResult.repo) {
			repoReal = repoResult.repo
			repoSource = repoResult.source
		}
	}
	if (!repoReal) {
		throw new KupError([
			errorLine('[Kup] [Error] Cannot get `repo` to sync to!'),
		])
	}

	// 检查 TOKEN
	if (await getToken()) {
		// 调用 GitHub API
		const idReal = id || fileInfo.meta.id
		if (idReal) {
			await updateIssue(fileInfo, repoReal, idReal)
		} else {
			await postIssue(fileInfo, repoReal, {
				file,
				repoSource,
				hasRepoInMeta: !!fileInfo.meta.repo,
			})
		}
	}
}

export {
	main,
}
