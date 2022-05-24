'use strict'

function validate(argv) {
	const {
		id,
		repo,
		_: files,
	} = argv

	let results = []
	if ('id' in argv) results.push(validateId(id))
	if ('repo' in argv) results.push(validateRepo(repo))
	results.push(validateFiles(files))
	// 筛选出有错误的结果
	const errorResults = results.filter((result) => result.status === false)

	// 处理校验结果
	errorResults.forEach((result) => {
		console.error('[Kup] [Error] ' + result.errorMsg)
	})

	// 目前只能处理第一个文件，因此提示用户
	if (files.length > 1) {
		console.warn('[Kup] [Warning] Limitation: only first file will be handled!')
	}

	return errorResults.length < 1
}

function validateId(id) {
	let errorMsg = ''
	if (id <= 0 || !Number.isInteger(id)) {
		errorMsg = '`id` must be a positive integer!'
	}
	return {
		status: !errorMsg,
		errorMsg,
	}
}
function validateRepo(repo) {
	const REPO_PATTERN = /^[\w\-]+\/[\w\-]+$/
	let errorMsg = ''
	if (!repo) {
		errorMsg = '`repo` must be a string!'
	} else if (!REPO_PATTERN.test(repo)) {
		errorMsg = '`repo` must match `{owner}/{repo}` pattern!'
	}
	return {
		status: !errorMsg,
		errorMsg,
	}
}
function validateFiles(files) {
	let errorMsg = ''
	if (!files.length) {
		errorMsg = 'Must specify a local file!'
	} else if (files.some((item) => !item)) {
		errorMsg = 'File name must not be empty!'
	}
	return {
		status: !errorMsg,
		errorMsg,
	}
}

module.exports = {
	validate,
	validateId,
	validateRepo,
	validateFiles,
}
