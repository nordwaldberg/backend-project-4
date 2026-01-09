import fs from 'fs/promises'
import path from 'path'
import nock from 'nock'
import { fileURLToPath } from 'url'
import { describe, beforeAll, afterAll, test, expect } from '@jest/globals'
import pageLoader from '../src/pageLoader.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const fixtures = path.join(__dirname, '..', '__fixtures__')
const read = f => fs.readFile(path.join(fixtures, f), 'utf8')

describe('base pageLoader test', () => {
  const url = 'https://ru.hexlet.io/courses'
  const outputDir = path.join(__dirname, 'tmp')
  let ctx = {}

  beforeAll(async () => {
    ctx.beforeHtml = await read('source.html')
    ctx.afterHtml = await read('result.html')
    ctx.imageBin = await fs.readFile(path.join(fixtures, 'nodejs.png'))
    ctx.cssBin = await fs.readFile(path.join(fixtures, 'application.css'))
    ctx.jsBin = await fs.readFile(path.join(fixtures, 'runtime.js'))
  })

  beforeAll(async () => {
    await fs.rm(outputDir, { recursive: true, force: true })
    await fs.mkdir(outputDir, { recursive: true })
    nock.cleanAll()

    nock('https://ru.hexlet.io')
      .intercept('/courses', 'GET')
      .reply(() => [200, ctx.beforeHtml])
    nock('https://ru.hexlet.io')
      .intercept('/assets/professions/nodejs.png', 'GET')
      .reply(() => [200, ctx.imageBin])
    nock('https://ru.hexlet.io')
      .intercept('/assets/application.css', 'GET')
      .reply(() => [200, ctx.cssBin])
    nock('https://ru.hexlet.io')
      .intercept('/packs/js/runtime.js', 'GET')
      .reply(() => [200, ctx.jsBin])

    const result = await pageLoader(url, outputDir)
    ctx.savedPath = result.replace('Page was successfully downloaded into ', '')
    ctx.expectedHtmlPath = path.join(outputDir, 'ru-hexlet-io-courses.html')
    ctx.resourcesDir = ctx.expectedHtmlPath.replace(/\.html$/, '_files')
  })

  test('should create correct HTML output file path', () => {
    expect(ctx.savedPath).toBe(`'${ctx.expectedHtmlPath}'`)
  })

  test('should create correct resources directory', () => {
    expect(ctx.resourcesDir).toBe(path.join(outputDir, 'ru-hexlet-io-courses_files'))
  })

  test('should save modified HTML matching the fixture', async () => {
    const savedHtml = await fs.readFile(ctx.expectedHtmlPath, 'utf8')
    expect(savedHtml.trim()).toBe(ctx.afterHtml.trim())
  })

  test('should download all expected local resources', async () => {
    const files = await fs.readdir(ctx.resourcesDir)
    expect(files).toContain('ru-hexlet-io-assets-professions-nodejs.png')
    expect(files).toContain('ru-hexlet-io-assets-application.css')
    expect(files).toContain('ru-hexlet-io-packs-js-runtime.js')
  })

  test('downloaded resources should match original content', async () => {
    const savedImg = await fs.readFile(path.join(ctx.resourcesDir, 'ru-hexlet-io-assets-professions-nodejs.png'))
    const savedCss = await fs.readFile(path.join(ctx.resourcesDir, 'ru-hexlet-io-assets-application.css'))
    const savedJs = await fs.readFile(path.join(ctx.resourcesDir, 'ru-hexlet-io-packs-js-runtime.js'))

    expect(savedImg).toStrictEqual(ctx.imageBin)
    expect(savedCss).toStrictEqual(ctx.cssBin)
    expect(savedJs).toStrictEqual(ctx.jsBin)
  })

  afterAll(async () => {
    await fs.rm(outputDir, { recursive: true, force: true })
  })
})
