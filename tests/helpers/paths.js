import path from 'path'
import { fileURLToPath } from 'url'

const testsDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(testsDir, '..', '..')
const fixturesDir = path.join(projectRoot, 'test', 'stuff')
const cliPath = path.join(projectRoot, 'bin', 'cli.js')

function fixturePath(filename) {
	return path.join(fixturesDir, filename)
}

export {
	projectRoot,
	fixturesDir,
	cliPath,
	fixturePath,
}
