'use strict'

function validate(argv) {
	const {
		id,
		repo,
		_: files,
	} = argv

	if ('id' in argv) {
		if (id <= 0 || !Number.isInteger(id)) {
			console.error('[Kup] [Error] `id` must be a positive integer!')
			process.exit(1)
		}
	}

	if ('repo' in argv) {
		if (!repo) {
			console.error('[Kup] [Error] `repo` must be a string!')
			process.exit(1)
		} else if (!_validateRepo(repo)) {
			console.error('[Kup] [Error] `repo` must match `{owner}/{repo}` pattern!')
			process.exit(1)
		}
	}

	if (!files.length) {
		console.error('[Kup] [Error] Must specify a local Markdown file!')
		process.exit(1)
	}
	if (files.length > 1) {
		console.warn('[Kup] [Warning] Limitation: only first file will be handled!')
	}
	if (files.some((item) => !item)) {
		console.error('[Kup] [Error] File name must not be empty!')
		process.exit(1)
	}
}

function _validateRepo(repo) {
	return /^[\w\-]+\/[\w\-]+$/.test(repo)
}

module.exports = {
	validate,
}
