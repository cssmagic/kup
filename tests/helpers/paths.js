import path from 'path'
import { fileURLToPath } from 'url'

const testsDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(testsDir, '..', '..')
const cliPath = path.join(projectRoot, 'bin', 'cli.js')

export {
	projectRoot,
	cliPath,
}
