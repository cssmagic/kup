#!/usr/bin/env node
'use strict'

const yargs = require('yargs')
const { isDebugging } = require('../lib/util')
const { main } = require('../lib/main')
const { validate } = require('../lib/validate')

if (isDebugging()) {
	console.log('[Kup] [Debug] Debug Mode is ON!')
	console.log('')
}

const argv = yargs
	.scriptName('kup')
	.usage('Kup -- A CLI tool to sync local Markdown files to GitHub issues.')
	.usage('Usage: $0 <file> [options]')
	.example('kup foo.md --repo aaa/bbb --id 123', '// sync foo.md to GitHub issue aaa/bbb#123')
	.option('repo', {
		alias: 'r',
		type: 'string',
		description: 'Specify GitHub repository',
	})
	.option('id', {
		alias: 'i',
		type: 'number',
		description: 'Specify GitHub issue ID',
	})
	.option('parse-only', {
		alias: 'p',
		type: 'boolean',
		description: 'Only parse file, without posting or syncing',
		hidden: true,
	})
	.alias('v', 'version')
	.alias('h', 'help')
	.parse()

// debug
if (isDebugging()) {
	console.log('[Kup] [Debug] argv =', argv)
}

// validate args
if (!validate(argv)) process.exit(1)

// do the job
main(argv)
	.then(() => {
		console.log('[Kup] Done!')
	})
