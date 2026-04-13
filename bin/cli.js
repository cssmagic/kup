#!/usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { printKupError } from '../lib/error.js'
import { isDebugging } from '../lib/util.js'
import { main } from '../lib/main.js'
import { validate } from '../lib/validate.js'

if (isDebugging()) {
	console.log('[Kup] [Debug] Debug Mode is ON!')
	console.log('')
}

const argv = yargs(hideBin(process.argv))
	.scriptName('kup')
	.usage('Kup -- A CLI tool to sync local Markdown files to GitHub issues.')
	.usage('Usage (publish to GitHub):  $0 <file> [options]')
	.usage('Usage (dump to local file): $0 [file] --dump [options]')
	.example('kup foo.md --repo aaa/bbb --id 123', '// sync foo.md to GitHub issue aaa/bbb#123')
	.example('kup 123.md --dump --repo aaa/bbb --id 123', '// dump GitHub issue aaa/bbb#123 to 123.md')
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
	.option('dump', {
		alias: 'd',
		type: 'boolean',
		description: 'Dump a GitHub issue to a local Markdown file',
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
	.catch((error) => {
		if (!printKupError(error)) {
			console.error(error)
		}
		process.exit(error.exitCode || 1)
	})
