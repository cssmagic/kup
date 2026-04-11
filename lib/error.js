class KupError extends Error {
	constructor(outputLines, exitCode = 1) {
		const firstLine = outputLines[0]
		super(firstLine?.text || 'Kup command failed.')
		this.name = 'KupError'
		this.outputLines = outputLines
		this.exitCode = exitCode
	}
}

function errorLine(text) {
	return {
		method: 'error',
		text,
	}
}

function logLine(text) {
	return {
		method: 'log',
		text,
	}
}

function printKupError(error) {
	if (!(error instanceof KupError)) return false

	error.outputLines.forEach(({ method, text }) => {
		console[method](text)
	})
	return true
}

export {
	KupError,
	errorLine,
	logLine,
	printKupError,
}
