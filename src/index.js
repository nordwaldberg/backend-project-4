import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import * as cheerio from 'cheerio'
import debug from 'debug'
import { downloadResource } from './downloadResource.js'

debug.enable('page-loader')
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
      const $ = cheerio.load(html)
      log('Creating resources directory...')
      return fs.mkdir(resourcesDir, { recursive: true }).then(() => $)
    })
    .then(($) => {
      log('Downloading webpage resources...')
      const resourcePromises = []

      resourceTypes.forEach(({ selector, attr }) => {
        $(selector).each((i, el) => {
          const p = downloadResource(el, attr, url, resourcesDir, pageUrl.hostname, $)

          if (p !== null) {
            resourcePromises.push(p)
          }
        })
      })

      $('link[rel="canonical"]').each((i, el) => {
        $(el).attr('href', path.join(path.basename(resourcesDir), path.basename(targetPath)))
      })

      return Promise.all(resourcePromises).then(() => $)
    })
    .then(($) => {
      log('Creating webpage html file...')
      return fs.writeFile(targetPath, $.html())
    })
    .then(() => {
      log('Webpage was successfully downloaded!')
      return `open ${targetPath}`
    })
    .catch((err) => {
      console.error('Downloading webpage error:', err)
      log(`Error! ${err}`)
      throw err
    })
}

export default pageLoader
