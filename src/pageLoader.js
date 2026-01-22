import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import * as cheerio from 'cheerio'
import debug from 'debug'
import Listr from 'listr'
import { downloadResource } from './downloadResource.js'

const log = debug('page-loader')

const resourceTypes = [
  { selector: 'img', attr: 'src' },
  { selector: 'script[src]', attr: 'src' },
  { selector: 'link[href]', attr: 'href' },
]

const getAbsolutePathToTarget = (url, outputDir) => {
  const urlObj = new URL(url)
  const segments = [urlObj.hostname, ...urlObj.pathname.split('/').filter(Boolean)]
  const safeSegments = segments.map(s => s.replace(/[^a-zA-Z0-9]/g, '-'))
  const filename = safeSegments.join('-') + '.html'
  return path.join(outputDir, filename)
}

const pageLoader = (url, output = process.cwd()) => {
  log('Downloading webpage...')

  const targetPath = getAbsolutePathToTarget(url, output)
  const resourcesDir = targetPath.replace(/\.html$/, '_files')
  const pageUrl = new URL(url)

  return axios.get(url)
    .then(response => response.data)
    .catch((err) => {
      if (err.response) {
        throw new Error(`Failed to load page ${url}: ${err.response.status}`)
      }
      throw new Error(`Network error while loading page ${url}`)
    })
    .then((html) => {
      log('Creating resources directory...')

      const $ = cheerio.load(html)

      return fs.mkdir(resourcesDir).then(() => $)
    })
    .then(($) => {
      log('Downloading webpage resources...')

      const resourcesTasks = []

      resourceTypes.forEach(({ selector, attr }) => {
        $(selector).each((i, el) => {
          const src = $(el).attr(attr)

          if (!src) {
            return
          }

          const resourceUrl = src.startsWith('http') ? src : new URL(src, url).href
          const resourceObj = new URL(resourceUrl)

          if (resourceObj.hostname !== pageUrl.hostname) return

          const ext = path.extname(resourceObj.pathname)
          if (!ext && selector !== 'link[href]') return

          resourcesTasks.push({
            title: resourceUrl,
            task: () => downloadResource(el, attr, resourceUrl, resourcesDir, $),
          })
        })
      })

      return new Listr(
        resourcesTasks,
        {
          concurrent: true,
          renderer: process.env.NODE_ENV === 'test' ? 'silent' : 'default',
        }).run().then(() => $)
    })
    .then(($) => {
      log('Creating webpage html file...')

      return fs.writeFile(targetPath, $.html()).catch((err) => {
        throw new Error(`Cannot write file ${targetPath}: ${err.code}`)
      })
    })
    .then(() => {
      log('Webpage was successfully downloaded!')

      return `Page was successfully downloaded into '${targetPath}'`
    })
}

export default pageLoader
