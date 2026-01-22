import path from 'path'
import axios from 'axios'
import fs from 'fs/promises'

const getResourceFilename = (resourceUrl) => {
  const urlObj = new URL(resourceUrl)
  const nameParts = [urlObj.hostname, ...urlObj.pathname.split('/').filter(Boolean)]

  let lastPart = nameParts.pop()
  const ext = path.extname(lastPart)
  lastPart = lastPart.replace(/\./g, '-')
  if (ext) lastPart = lastPart.slice(0, -ext.length) + ext

  const safeParts = nameParts.map(p => p.replace(/[^a-zA-Z0-9]/g, '-'))
  safeParts.push(lastPart)

  if (!ext) safeParts[safeParts.length - 1] += '.html'

  return safeParts.join('-')
}

const downloadResource = (elem, attr, resourceUrl, resourcesDir, $) => {
  const filename = getResourceFilename(resourceUrl)
  const filepath = path.join(resourcesDir, filename)

  return axios
    .get(resourceUrl, { responseType: 'arraybuffer' })
    .then(response => response.data)
    .catch((err) => {
      if (err.response) {
        throw new Error(`Failed to load resource ${resourceUrl}: ${err.response.status}`)
      }
      throw new Error(`Network error while loading resource ${resourceUrl}`)
    })
    .then((data) => {
      return fs.writeFile(filepath, data)
    })
    .then(() => {
      $(elem).attr(attr, path.join(path.basename(resourcesDir), filename))
    })
}

export {
  downloadResource,
  getResourceFilename,
}
