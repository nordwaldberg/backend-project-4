import fn from '../__fixtures__/index.js'
import { test, expect } from '@jest/globals'

test('base check', () => {
  expect(fn('N1')).toBe('Base test N1')
})
