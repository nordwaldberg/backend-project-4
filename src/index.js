import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import * as cheerio from 'cheerio'
import { downloadResource } from './downloadResource.js'

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
  const targetPath = getAbsolutePathToTarget(url, output)
  const resourcesDir = targetPath.replace(/\.html$/, '_files')
  const pageUrl = new URL(url)

  return axios.get(url)
    .then(({ data: html }) => {
      const $ = cheerio.load(html)
      return fs.mkdir(resourcesDir, { recursive: true }).then(() => $)
    })
    .then(($) => {
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
    .then($ => fs.writeFile(targetPath, $.html()))
    .then(() => `open ${targetPath}`)
    .catch((err) => {
      console.error('Error downloading web page:', err)
      throw err
    })
}

export default pageLoader
