import fsPromises from 'fs/promises'

async function fileExists(pathname) {
	try {
		await fsPromises.access(pathname)
		return true
	} catch {
		return false
	}
}

function readTextFile(pathname) {
	return fsPromises.readFile(pathname)
		.then((bin) => {
			// 去除 utf-8 文本文件的 BOM
			if (bin[0] === 0xEF && bin[1] === 0xBB && bin[2] === 0xBF) {
				bin = bin.slice(3)
			}
			return bin.toString('utf-8')
		})
}

function writeTextFile(pathname, content) {
	return fsPromises.writeFile(pathname, content)
}

export {
	fileExists,
	readTextFile,
	writeTextFile,
}
