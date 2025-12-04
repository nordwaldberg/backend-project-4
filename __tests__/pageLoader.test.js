import { jest, describe, test, expect, beforeEach } from '@jest/globals'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import pageLoader from '../src/index.js'

jest.mock('axios')

const fixturesPath = path.join(__dirname, '__fixtures__')

const readFixture = (filename) =>
  fs.readFile(path.join(fixturesPath, filename), 'utf-8')

describe('pageLoader', () => {
  let tmpDir

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-test'));
  })
  
  
})
