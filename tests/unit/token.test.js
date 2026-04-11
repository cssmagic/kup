import { describe, expect, it } from 'vitest'

import { validateToken } from '../../lib/token.js'

describe('validateToken()', () => {
	it('accepts classic and fine-grained PATs', () => {
		expect(validateToken('ghp_12345678901234567890')).toBe(true)
		expect(validateToken('github_pat_12345678901234567890')).toBe(true)
	})

	it('rejects empty, short, or malformed tokens', () => {
		expect(validateToken('')).toBe(false)
		expect(validateToken('ghp_short')).toBe(false)
		expect(validateToken('token 12345678901234567890')).toBe(false)
	})
})
