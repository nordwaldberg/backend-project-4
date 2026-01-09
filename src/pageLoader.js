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
  { selector: 'link[rel="stylesheet"]', attr: 'href' },
  { selector: 'script[src]', attr: 'src' },
]

const getAbsolutePathToTarget = (filepath, targetDir) => {
  const urlData = filepath.replace(/https?:\/\//i, '').split('/')
  const targetUrl = urlData[0].replace(/[^a-zA-Z0-9]/g, '-')
  const targetFile = urlData[urlData.length - 1] + '.html'
  return path.join(targetDir, [targetUrl, targetFile].join('-'))
}

const pageLoader = (url, output) => {
  log('Downloading webpage...')

  const targetPath = getAbsolutePathToTarget(url, output)
  const resourcesDir = targetPath.replace(/\.html$/, '_files')
  const pageUrl = new URL(url)

  return axios.get(url)
    .then(({ data: html }) => {
      log('Creating resources directory...')

      const $ = cheerio.load(html)
      return fs.mkdir(resourcesDir, { recursive: true }).then(() => $)
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

          const isLocal = resourceObj.hostname === pageUrl.hostname
            || resourceObj.hostname.endsWith(`.${pageUrl.hostname}`)

          if (!isLocal) {
            return
          }

          resourcesTasks.push({
            title: resourceUrl,
            task: () => downloadResource(el, attr, resourceUrl, resourcesDir, $),
          })
        })
      })

      $('link[rel="canonical"]').each((i, el) => {
        $(el).attr('href', path.join(path.basename(resourcesDir), path.basename(targetPath)))
      })

      return new Listr(
        resourcesTasks,
        {
          concurrent: true,
          exitOnError: false,
          renderer: process.env.NODE_ENV === 'test' ? 'silent' : 'default',
        }).run().then(() => $)
    })
    .then(($) => {
      log('Creating webpage html file...')

      return fs.writeFile(targetPath, $.html())
    })
    .then(() => {
      log('Webpage was successfully downloaded!')

      return `Page was successfully downloaded into '${targetPath}'`
    })
    .catch((err) => {
      log(`Error! ${err}`)

      console.error('Downloading webpage error:', err)
      throw err
    })
}

export default pageLoader
