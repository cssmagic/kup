#!/usr/bin/env node
'use strict'

const yargs = require('yargs')
const { main } = require('../lib/main')
const { validate } = require('../lib/validate')

const argv = yargs
	.scriptName('kup')
	.usage('Usage: $0 <file> [options]')
	.example('kup foo.md --repo aaa/bbb --id 13', '// sync foo.md to GitHub issue aaa/bbb#13')
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
	.argv

// debug
// console.log('[Kup] [Debug] argv =', argv)

// validate args
validate(argv)

// do the job
main(argv)
	.then(() => {
		console.log('[Kup] Done!')
	})
