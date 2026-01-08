import path from 'path'
import axios from 'axios'
import fs from 'fs/promises'

const getResourceFilename = (resourceUrl) => {
  const urlData = resourceUrl.split('/').slice(2)
  const rawName = urlData.join('-')

  return rawName.replace(/\.(?=.*\.)/g, '-')
}

const downloadResource = (elem, attr, baseUrl, resourcesDir, pageHostname, $) => {
  const src = $(elem).attr(attr)

  if (!src) {
    return null
  }

  const resourceUrl = src.startsWith('http') ? src : new URL(src, baseUrl).href
  const resourceObj = new URL(resourceUrl)

  const isLocal = resourceObj.hostname === pageHostname
    || resourceObj.hostname.endsWith(`.${pageHostname}`)

  if (!isLocal) {
    return null
  }

  const filename = getResourceFilename(resourceUrl)
  const filepath = path.join(resourcesDir, filename)

  return axios
    .get(resourceUrl, { responseType: 'arraybuffer' })
    .then(({ data }) => fs.writeFile(filepath, data))
    .then(() => {
      $(elem).attr(attr, path.join(path.basename(resourcesDir), filename))
    })
}

export {
  downloadResource,
  getResourceFilename,
}
