import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import * as cheerio from 'cheerio'

const pageLoader = async (url, output) => {
  const targetPath = getAbsolutePathToTarget(url, output)
  const resourcesDir = targetPath.replace(/\.html$/, '_files')

  return axios.get(url)
    .then(({ data: html }) => {
      const $ = cheerio.load(html)
      return fs.mkdir(resourcesDir, { recursive: true }).then(() => $)
    })
    .then(($) => {
      const imgPromises = []
      $('img').each((index, img) => {
        const src = $(img).attr('src')
        if (!src) return

        const filename = getResourceFileName(src)
        const filepath = path.join(resourcesDir, filename)

        const imgPromise = axios
          .get(src.startsWith('http') ? src : new URL(src, url).href, { responseType: 'arraybuffer' })
          .then(({ data }) => fs.writeFile(filepath, data))
          .then(() => {
            $(img).attr('src', path.join(path.basename(resourcesDir), filename))
          })

        imgPromises.push(imgPromise)
      })

      return Promise.all(imgPromises).then(() => $)
    })
    .then($ => fs.writeFile(targetPath, $.html()))
    .then(() => `open ${targetPath}`)
    .catch((err) => {
      console.error('Error downloading web page:', err)
      throw err
    })
}

const getAbsolutePathToTarget = (filepath, targetDir) => {
  const urlData = filepath.replace(/https?:\/\//i, '').split('/')
  const targetUrl = urlData[0].replace(/[^a-zA-Z0-9]/g, '-')
  const targetFile = urlData[urlData.length - 1] + '.html'

  return targetDir + '/' + [targetUrl, targetFile].join('-')
}

const getResourceFileName = (resourceUrl) => {
  const urlData = resourceUrl.split('/')
  const rawName = urlData[urlData.length - 1]

  return rawName.replace(/[^a-zA-Z0-9.]/g, '-')
}

export default pageLoader
