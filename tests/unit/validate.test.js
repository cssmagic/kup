import { describe, expect, it, vi } from 'vitest'

import {
	validate,
	validateFiles,
	validateId,
	validateRepo,
} from '../../lib/validate.js'

describe('validateRepo()', () => {
	it('accepts owner/repo strings', () => {
		expect(validateRepo('cssmagic/kup')).toEqual({
			status: true,
			errorMsg: '',
		})
	})

	it('rejects malformed repo values', () => {
		expect(validateRepo('kup')).toEqual({
			status: false,
			errorMsg: '`repo` must match `{owner}/{repo}` pattern!',
		})
	})
})

describe('validateId()', () => {
	it('accepts positive integers', () => {
		expect(validateId(1)).toEqual({
			status: true,
			errorMsg: '',
		})
	})

	it('rejects non-positive or non-integer values', () => {
		expect(validateId(0).status).toBe(false)
		expect(validateId(1.5).status).toBe(false)
	})
})

describe('validateFiles()', () => {
	it('requires at least one file path', () => {
		expect(validateFiles([])).toEqual({
			status: false,
			errorMsg: 'Must specify a local file!',
		})
	})

	it('rejects empty file names', () => {
		expect(validateFiles(['ok.md', ''])).toEqual({
			status: false,
			errorMsg: 'File name must not be empty!',
		})
	})
})

describe('validate()', () => {
	it('returns true for a valid argv object', () => {
		expect(validate({
			_: ['doc.md'],
			repo: 'cssmagic/kup',
			id: 3,
		})).toBe(true)
	})

	it('prints validation errors and returns false for invalid input', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

		expect(validate({
			_: [],
			repo: 'invalid',
			id: 0,
		})).toBe(false)
		expect(errorSpy).toHaveBeenCalledTimes(3)
	})
})
