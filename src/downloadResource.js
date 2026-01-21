import path from 'path'
import axios from 'axios'
import fs from 'fs/promises'

const getResourceFilename = (resourceUrl) => {
  const urlData = resourceUrl.split('/').slice(2)
  const rawName = urlData.join('-')

  return rawName.replace(/\.(?=.*\.)/g, '-')
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
        .catch((err) => {
          throw new Error(`Cannot write file ${filepath}: ${err.code}`)
        })
    })
    .then(() => {
      $(elem).attr(attr, path.join(path.basename(resourcesDir), filename))
    })
}

export {
  downloadResource,
  getResourceFilename,
}
